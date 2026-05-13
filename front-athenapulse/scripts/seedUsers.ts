import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import * as path from 'path'
import { config } from 'dotenv'

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') })

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Debug: Check if config is loaded
console.log('Firebase Config Check:')
console.log('API Key:', firebaseConfig.apiKey ? '✅ Loaded' : '❌ Missing')
console.log('Project ID:', firebaseConfig.projectId ? '✅ Loaded' : '❌ Missing')

if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase configuration missing! Check your .env.local file')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// ... rest of your fakeUsers array and seedUsers function
const fakeUsers = [
  // Pharmaciens
  {
    nom: 'Martin',
    prenom: 'Sophie',
    adresse: '12 Rue de la Paix, 75001 Paris',
    numTel: '0612345678',
    email: 'sophie.martin@pharmacie.fr',
    role: 'pharmacien',
    password: 'password123'
  },
  {
    nom: 'Bernard',
    prenom: 'Philippe',
    adresse: '45 Avenue des Champs, 69002 Lyon',
    numTel: '0623456789',
    email: 'philippe.bernard@pharmacie.fr',
    role: 'pharmacien',
    password: 'password123'
  },
  {
    nom: 'Petit',
    prenom: 'Catherine',
    adresse: '8 Boulevard Victor Hugo, 13001 Marseille',
    numTel: '0634567890',
    email: 'catherine.petit@pharmacie.fr',
    role: 'pharmacien',
    password: 'password123'
  },
  
  // Parapharmaciens
  {
    nom: 'Dubois',
    prenom: 'Thomas',
    adresse: '23 Rue Nationale, 59000 Lille',
    numTel: '0645678901',
    email: 'thomas.dubois@parapharmacie.fr',
    role: 'parapharmacien',
    password: 'password123'
  },
  {
    nom: 'Leroy',
    prenom: 'Julie',
    adresse: '67 Cours Mirabeau, 13100 Aix-en-Provence',
    numTel: '0656789012',
    email: 'julie.leroy@parapharmacie.fr',
    role: 'parapharmacien',
    password: 'password123'
  },
  
  // Docteurs (avec spécialité)
  {
    nom: 'Moreau',
    prenom: 'Jean',
    adresse: '156 Rue de la Santé, 75014 Paris',
    numTel: '0667890123',
    email: 'jean.moreau@cabinet.fr',
    role: 'docteur',
    specialite: 'Cardiologue',
    password: 'password123'
  },
  {
    nom: 'Simon',
    prenom: 'Marie',
    adresse: '89 Avenue de la République, 33000 Bordeaux',
    numTel: '0678901234',
    email: 'marie.simon@cabinet.fr',
    role: 'docteur',
    specialite: 'Dermatologue',
    password: 'password123'
  },
  {
    nom: 'Laurent',
    prenom: 'Pierre',
    adresse: '34 Rue des Lilas, 44000 Nantes',
    numTel: '0689012345',
    email: 'pierre.laurent@cabinet.fr',
    role: 'docteur',
    specialite: 'Gynécologue',
    password: 'password123'
  },
  {
    nom: 'Garcia',
    prenom: 'Isabelle',
    adresse: '12 Place du Capitole, 31000 Toulouse',
    numTel: '0690123456',
    email: 'isabelle.garcia@cabinet.fr',
    role: 'docteur',
    specialite: 'Pédiatre',
    password: 'password123'
  },
  {
    nom: 'Roux',
    prenom: 'Michel',
    adresse: '56 Rue de la Gare, 67000 Strasbourg',
    numTel: '0612345679',
    email: 'michel.roux@cabinet.fr',
    role: 'docteur',
    specialite: 'Neurologue',
    password: 'password123'
  },
  
  // Délégués
  {
    nom: 'Vincent',
    prenom: 'Nicolas',
    adresse: '78 Rue de la République, 69003 Lyon',
    numTel: '0623456780',
    email: 'nicolas.vincent@delegue.fr',
    role: 'delegue',
    password: 'password123'
  },
  {
    nom: 'Girard',
    prenom: 'Laure',
    adresse: '45 Avenue Jean Jaurès, 75019 Paris',
    numTel: '0634567891',
    email: 'laure.girard@delegue.fr',
    role: 'delegue',
    password: 'password123'
  },
  // Add these to your fakeUsers array:

// Additional Délégués
{
  nom: 'Lefebvre',
  prenom: 'Thomas',
  adresse: '15 Rue de la Libération, 13006 Marseille',
  numTel: '0612345680',
  email: 'thomas.lefebvre@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Mercier',
  prenom: 'Camille',
  adresse: '8 Avenue Victor Hugo, 75016 Paris',
  numTel: '0623456781',
  email: 'camille.mercier@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Blanc',
  prenom: 'Antoine',
  adresse: '42 Rue de la République, 69001 Lyon',
  numTel: '0634567892',
  email: 'antoine.blanc@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Garnier',
  prenom: 'Sophie',
  adresse: '23 Boulevard des Alpes, 74000 Annecy',
  numTel: '0645678903',
  email: 'sophie.garnier@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Moulin',
  prenom: 'Lucas',
  adresse: '7 Place de la Cathédrale, 67000 Strasbourg',
  numTel: '0656789014',
  email: 'lucas.moulin@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Renaud',
  prenom: 'Julie',
  adresse: '19 Rue Nationale, 59000 Lille',
  numTel: '0667890125',
  email: 'julie.renaud@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Faure',
  prenom: 'Nicolas',
  adresse: '56 Quai de la Fontaine, 30000 Nîmes',
  numTel: '0678901236',
  email: 'nicolas.faure@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Baron',
  prenom: 'Claire',
  adresse: '31 Rue Sainte-Catherine, 33000 Bordeaux',
  numTel: '0689012347',
  email: 'claire.baron@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Roy',
  prenom: 'Alexandre',
  adresse: '11 Avenue Jean Jaurès, 44000 Nantes',
  numTel: '0690123458',
  email: 'alexandre.roy@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'David',
  prenom: 'Élodie',
  adresse: '27 Rue de la Paix, 29200 Brest',
  numTel: '0612345679',
  email: 'elodie.david@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Michel',
  prenom: 'Jérôme',
  adresse: '63 Boulevard de la Liberté, 35000 Rennes',
  numTel: '0623456780',
  email: 'jerome.michel@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Rousseau',
  prenom: 'Aurélie',
  adresse: '14 Rue des Francs-Bourgeois, 75004 Paris',
  numTel: '0634567891',
  email: 'aurelie.rousseau@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Mathieu',
  prenom: 'Sébastien',
  adresse: '38 Avenue de l\'Europe, 31400 Toulouse',
  numTel: '0645678902',
  email: 'sebastien.mathieu@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Giraud',
  prenom: 'Marine',
  adresse: '9 Place de l\'Horloge, 84000 Avignon',
  numTel: '0656789013',
  email: 'marine.giraud@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Martin',
  prenom: 'Benoît',
  adresse: '72 Rue de Paris, 94500 Champigny-sur-Marne',
  numTel: '0667890124',
  email: 'benoit.martin@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Bonnet',
  prenom: 'Laura',
  adresse: '5 Rue Gambetta, 57000 Metz',
  numTel: '0678901235',
  email: 'laura.bonnet@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Fournier',
  prenom: 'Grégory',
  adresse: '45 Rue Jeanne d\'Arc, 76000 Rouen',
  numTel: '0689012346',
  email: 'gregory.fournier@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Marchand',
  prenom: 'Vanessa',
  adresse: '17 Rue des Tanneurs, 21000 Dijon',
  numTel: '0690123457',
  email: 'vanessa.marchand@delegue.fr',
  role: 'delegue',
  password: 'password123'
},
{
  nom: 'Bertrand',
  prenom: 'Stéphane',
  adresse: '33 Rue Nationale, 37100 Tours',
  numTel: '0612345680',
  email: 'stephane.bertrand@delegue.fr',
  role: 'delegue',
  password: 'password123'
}
]

async function seedUsers() {
  console.log('🌱 Seeding users...')
  console.log(`📊 Total users to create: ${fakeUsers.length}`)
  
  let successCount = 0
  let failCount = 0
  
  for (const user of fakeUsers) {
    try {
      console.log(`🔄 Creating user: ${user.email}...`)
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        user.email, 
        user.password
      )
      
      // Prepare user data for Firestore (remove password)
      const { password, ...userData } = user
      
      // Create Firestore user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userData,
        id: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      
      console.log(`✅ Created user: ${user.prenom} ${user.nom} (${user.role}) - ${user.email}`)
      successCount++
      
    } catch (error: any) {
      console.error(`❌ Failed to create user ${user.email}:`, error.message)
      failCount++
    }
  }
  
  console.log('\n📊 Seeding complete!')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📝 Total: ${fakeUsers.length}`)
  
  process.exit(0)
}

// Run the seed function
seedUsers().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})