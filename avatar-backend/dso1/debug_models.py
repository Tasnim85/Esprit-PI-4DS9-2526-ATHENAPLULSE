# debug_models.py
import os
import joblib

print("Current directory:", os.getcwd())
print("\nFiles in current directory:")
for f in os.listdir('.'):
    if f.endswith('.joblib'):
        print(f"  {f}")

print("\nFiles in models folder:")
if os.path.exists('models'):
    for f in os.listdir('models'):
        if f.endswith('.joblib'):
            print(f"  {f}")
            # Try to load it
            try:
                model = joblib.load(f'models/{f}')
                print(f"    ✅ Successfully loaded {f}")
            except Exception as e:
                print(f"    ❌ Error loading {f}: {e}")
else:
    print("  models folder not found")