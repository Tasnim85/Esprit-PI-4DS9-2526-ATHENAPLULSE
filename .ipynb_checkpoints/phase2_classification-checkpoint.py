"""
================================================================================
  PHASE 2 — Pharmaceutical Phase Classification
================================================================================
  Input : DataFrame produced by HybridRetrievalModel.retrieve()
            Columns: produit | combined_text | symptoms_spacy_lemmatized
                     form    | phase         | similarity_score | retrieval_source

  Output: Same DataFrame + new columns:
            predicted_phase      – most likely phase (str)
            phase_confidence     – probability of top class (float)
            phase_probabilities  – dict {phase: prob} for all classes

  Three classifiers are trained / available:
    • Baseline  : Logistic Regression  (lr)
    • Model 1   : Random Forest        (rf)
    • Model 2   : XGBoost              (xgb)

  Feature engineering uses the same TF-IDF vectorizer from Phase 1 +
  two hand-crafted numeric features (form_encoded, similarity_score).
================================================================================
"""

# ── stdlib / third-party ──────────────────────────────────────────────────────
import numpy as np
import pandas as pd
from scipy.sparse import hstack, csr_matrix

from sklearn.linear_model    import LogisticRegression
from sklearn.ensemble        import RandomForestClassifier
from sklearn.preprocessing   import LabelEncoder
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics         import classification_report, accuracy_score

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("⚠️  XGBoost not installed — Model 2 will be skipped.")


# ─────────────────────────────────────────────────────────────────────────────
class PhaseClassifier:
    """
    Phase 2 classifier.

    Usage
    -----
    # 1. Train (one-time, uses your full labelled df)
    clf = PhaseClassifier(tfidf_vectorizer, full_df)
    clf.fit()

    # 2. Predict on Phase-1 output
    phase1_output = hybrid_model.retrieve("acné", top_k=50)
    ranked        = clf.predict(phase1_output)

    # 3. Compare classifiers
    clf.evaluate()
    """

    FORM_ORDER = [
        "comprimé", "gélule", "sirop", "suspension", "solution",
        "crème", "gel", "lotion", "sérum", "spray",
        "patch", "suppositoire", "pommade", "poudre", "autre",
    ]

    def __init__(self, tfidf_vectorizer, full_df: pd.DataFrame):
        """
        Parameters
        ----------
        tfidf_vectorizer : fitted sklearn TfidfVectorizer  (from Phase 1)
        full_df          : complete product catalogue DataFrame
                           Must contain: combined_text, form, phase columns
        """
        self.vectorizer   = tfidf_vectorizer
        self.full_df      = full_df.copy()
        self.label_enc    = LabelEncoder()
        self.form_map     = {f: i for i, f in enumerate(self.FORM_ORDER)}

        # Classifiers (populated by fit())
        self.models: dict = {}
        self.best_model_name: str = "lr"
        self._is_fitted = False

    # ──────────────────────────────────────────────────────────────────────────
    # PUBLIC
    # ──────────────────────────────────────────────────────────────────────────

    def fit(self, cv_folds: int = 5, verbose: bool = True) -> "PhaseClassifier":
        """
        Build feature matrix from full_df, train all classifiers,
        run cross-validation, pick best model.
        """
        if verbose:
            print("=" * 70)
            print("🏋️  PHASE 2 — Training Phase Classifiers")
            print("=" * 70)

        X, y = self._build_features(self.full_df, fit_label_enc=True)

        cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
        cv_scores = {}

        # ── Baseline: Logistic Regression ─────────────────────────────────
        lr = LogisticRegression(
            C=1.0, max_iter=1000, solver="lbfgs",
            multi_class="multinomial", random_state=42
        )
        lr.fit(X, y)
        cv_scores["lr"] = cross_val_score(lr, X, y, cv=cv, scoring="accuracy")
        self.models["lr"] = lr
        if verbose:
            print(f"  ✅ Logistic Regression  CV acc: "
                  f"{cv_scores['lr'].mean():.4f} ± {cv_scores['lr'].std():.4f}")

        # ── Model 1: Random Forest ─────────────────────────────────────────
        rf = RandomForestClassifier(
            n_estimators=200, max_depth=None,
            min_samples_leaf=2, random_state=42, n_jobs=-1
        )
        rf.fit(X, y)
        cv_scores["rf"] = cross_val_score(rf, X, y, cv=cv, scoring="accuracy")
        self.models["rf"] = rf
        if verbose:
            print(f"  ✅ Random Forest        CV acc: "
                  f"{cv_scores['rf'].mean():.4f} ± {cv_scores['rf'].std():.4f}")

        # ── Model 2: XGBoost ───────────────────────────────────────────────
        if XGBOOST_AVAILABLE:
            n_classes = len(self.label_enc.classes_)
            xgb = XGBClassifier(
                n_estimators=200, max_depth=6,
                learning_rate=0.1, subsample=0.8,
                use_label_encoder=False,
                eval_metric="mlogloss",
                objective="multi:softprob" if n_classes > 2 else "binary:logistic",
                num_class=n_classes if n_classes > 2 else None,
                random_state=42, n_jobs=-1
            )
            # XGBoost needs dense array when sparse is small
            X_dense = X.toarray() if hasattr(X, "toarray") else X
            xgb.fit(X_dense, y)
            cv_scores["xgb"] = cross_val_score(
                xgb, X_dense, y, cv=cv, scoring="accuracy"
            )
            self.models["xgb"] = xgb
            if verbose:
                print(f"  ✅ XGBoost              CV acc: "
                      f"{cv_scores['xgb'].mean():.4f} ± {cv_scores['xgb'].std():.4f}")
        else:
            cv_scores["xgb"] = np.array([0.0])

        # ── Select best model ─────────────────────────────────────────────
        self.best_model_name = max(cv_scores, key=lambda k: cv_scores[k].mean())
        self._is_fitted = True

        if verbose:
            print(f"\n  🏆 Best model : {self.best_model_name.upper()}  "
                  f"(CV acc = {cv_scores[self.best_model_name].mean():.4f})")
            print("=" * 70)

        return self

    def predict(
        self,
        phase1_output: pd.DataFrame,
        model_name: str = "best",
    ) -> pd.DataFrame:
        """
        Classify the phase for every product in the Phase-1 output DataFrame.

        Parameters
        ----------
        phase1_output : DataFrame from HybridRetrievalModel.retrieve()
        model_name    : 'best' | 'lr' | 'rf' | 'xgb'

        Returns
        -------
        Enriched DataFrame with extra columns:
            predicted_phase, phase_confidence, phase_probabilities
        """
        self._check_fitted()
        model_name = self.best_model_name if model_name == "best" else model_name
        model      = self.models[model_name]

        results = phase1_output.copy()
        X, _    = self._build_features(
            results,
            fit_label_enc=False,
            similarity_col="similarity_score",
        )

        # XGBoost needs dense
        if model_name == "xgb":
            X = X.toarray() if hasattr(X, "toarray") else X

        proba_matrix = model.predict_proba(X)          # (n, n_classes)
        pred_idx     = proba_matrix.argmax(axis=1)
        pred_labels  = self.label_enc.inverse_transform(pred_idx)
        confidences  = proba_matrix.max(axis=1)

        results["predicted_phase"]      = pred_labels
        results["phase_confidence"]     = confidences.round(4)
        results["phase_probabilities"]  = [
            dict(zip(self.label_enc.classes_, row.round(4)))
            for row in proba_matrix
        ]
        results["classifier_used"] = model_name

        # ── Sort: keep Phase-1 rank but surface high-confidence first ──────
        results = results.sort_values(
            ["phase_confidence", "similarity_score"],
            ascending=False
        ).reset_index(drop=True)

        return results

    def evaluate(self, test_df: pd.DataFrame = None, verbose: bool = True) -> dict:
        """
        Print full classification report for all models.
        Uses full_df if test_df is None (in-sample, for sanity-check only).
        """
        self._check_fitted()
        df   = test_df if test_df is not None else self.full_df
        X, y = self._build_features(df, fit_label_enc=False)
        reports = {}

        for name, model in self.models.items():
            X_in = X.toarray() if name == "xgb" and hasattr(X, "toarray") else X
            y_pred = model.predict(X_in)
            acc    = accuracy_score(y, y_pred)
            report = classification_report(
                y, y_pred,
                target_names=self.label_enc.classes_,
                zero_division=0,
            )
            reports[name] = {"accuracy": acc, "report": report}
            if verbose:
                print(f"\n{'─'*60}")
                print(f"  {name.upper()}  (accuracy = {acc:.4f})")
                print(f"{'─'*60}")
                print(report)

        return reports

    # ──────────────────────────────────────────────────────────────────────────
    # PRIVATE
    # ──────────────────────────────────────────────────────────────────────────

    def _build_features(
        self,
        df: pd.DataFrame,
        fit_label_enc: bool = False,
        similarity_col: str = None,
    ):
        """
        Build (X, y) from a DataFrame.

        Feature set
        -----------
        1. TF-IDF of combined_text          → sparse (n, vocab)
        2. TF-IDF of symptoms_spacy_lemmatized → sparse (n, vocab)  [if present]
        3. form_encoded                     → dense  (n, 1)
        4. similarity_score                 → dense  (n, 1)  [if column present]
        """
        # ── Text features ─────────────────────────────────────────────────
        texts_combined = df["combined_text"].fillna("").tolist()
        X_tfidf        = self.vectorizer.transform(texts_combined)

        # Symptoms column (optional but common)
        if "symptoms_spacy_lemmatized" in df.columns:
            texts_symp = df["symptoms_spacy_lemmatized"].fillna("").tolist()
            X_symp     = self.vectorizer.transform(texts_symp)
            X_text     = hstack([X_tfidf, X_symp])
        else:
            X_text = X_tfidf

        # ── Numeric features ──────────────────────────────────────────────
        form_col = df["form"].fillna("autre").str.lower() \
                     .map(lambda f: self.form_map.get(f, len(self.form_map)))
        numeric  = form_col.values.reshape(-1, 1).astype(float)

        if similarity_col and similarity_col in df.columns:
            sim = df[similarity_col].fillna(0).values.reshape(-1, 1)
            numeric = np.hstack([numeric, sim])

        X = hstack([X_text, csr_matrix(numeric)])

        # ── Labels ────────────────────────────────────────────────────────
        if "phase" in df.columns:
            phases = df["phase"].fillna("unknown").astype(str)
            if fit_label_enc:
                y = self.label_enc.fit_transform(phases)
            else:
                # Handle unseen labels gracefully
                known = set(self.label_enc.classes_)
                phases = phases.apply(lambda p: p if p in known else "unknown")
                # "unknown" might not be in training classes → map to 0
                try:
                    y = self.label_enc.transform(phases)
                except ValueError:
                    y = np.zeros(len(phases), dtype=int)
        else:
            y = np.zeros(len(df), dtype=int)   # dummy y when phase unknown

        return X, y

    def _check_fitted(self):
        if not self._is_fitted:
            raise RuntimeError("Call .fit() before .predict() or .evaluate().")


# =============================================================================
# PIPELINE CONNECTOR  –  drop-in glue between Phase 1 and Phase 2
# =============================================================================

def run_phase2(
    query: str,
    hybrid_model,          # HybridRetrievalModel instance (Phase 1)
    phase_classifier,      # PhaseClassifier instance (Phase 2)
    top_k: int = 50,
    retrieval_strategy: str = "hybrid",
    classifier: str = "best",
    verbose: bool = True,
) -> pd.DataFrame:
    """
    End-to-end Phase 1 → Phase 2 connector.

    Parameters
    ----------
    query              : raw user query (EN / FR)
    hybrid_model       : fitted HybridRetrievalModel from Phase 1
    phase_classifier   : fitted PhaseClassifier
    top_k              : number of candidates to retrieve
    retrieval_strategy : 'hybrid' | 'tfidf' | 'mpnet'
    classifier         : 'best' | 'lr' | 'rf' | 'xgb'
    verbose            : print a summary table

    Returns
    -------
    DataFrame ready for Phase 3 (ranked product list with predicted phases)
    """
    # ── Phase 1: retrieval ────────────────────────────────────────────────
    phase1_output = hybrid_model.retrieve(query, top_k=top_k, strategy=retrieval_strategy)

    # ── Phase 2: phase classification ────────────────────────────────────
    phase2_output = phase_classifier.predict(phase1_output, model_name=classifier)

    if verbose:
        _print_summary(query, phase2_output)

    return phase2_output


def _print_summary(query: str, df: pd.DataFrame, n: int = 10):
    """Pretty-print top-N results after Phase 2."""
    print("\n" + "=" * 80)
    print(f"  Phase 2 results for: \"{query}\"")
    print("=" * 80)
    cols = ["produit", "predicted_phase", "phase_confidence",
            "similarity_score", "retrieval_source"]
    display_cols = [c for c in cols if c in df.columns]
    print(df[display_cols].head(n).to_string(index=False))
    print("─" * 80)

    # Phase distribution of top-K
    dist = df["predicted_phase"].value_counts()
    print("\n  📊 Phase distribution (top retrieved):")
    for phase, count in dist.items():
        bar = "█" * count
        print(f"     {phase:<20} {bar}  ({count})")
    print("=" * 80)


# =============================================================================
# USAGE EXAMPLE  (run this cell after Phase 1 has initialised)
# =============================================================================
"""
# ── Step 1: Train Phase 2 (once, using your full labelled catalogue) ──────────
phase_clf = PhaseClassifier(
    tfidf_vectorizer = tfidf_vectorizer,   # same vectorizer from Phase 1
    full_df          = df,                 # your full catalogue df
)
phase_clf.fit()

# ── Step 2: Run the full Phase 1 → Phase 2 pipeline ─────────────────────────
results = run_phase2(
    query             = "j'ai la peau qui tiraille après la douche",
    hybrid_model      = hybrid_model,       # Phase 1 instance
    phase_classifier  = phase_clf,
    top_k             = 50,
    retrieval_strategy= "hybrid",
    classifier        = "best",
)

# ── Step 3: Inspect ───────────────────────────────────────────────────────────
print(results[["produit", "predicted_phase", "phase_confidence",
               "similarity_score"]].head(20))

# ── Optional: evaluate all classifiers ───────────────────────────────────────
phase_clf.evaluate()

# ── Optional: predict on a pre-retrieved Phase-1 DataFrame ───────────────────
phase1_df   = hybrid_model.retrieve("acné", top_k=50)
phase2_df   = phase_clf.predict(phase1_df, model_name="rf")
"""
