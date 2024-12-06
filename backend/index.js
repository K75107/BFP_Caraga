require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Ensure JSON payloads are parsed before routes are handled

const serviceAccount = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.CLIENT_EMAIL)}`,
  universe_domain: "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://accountingsystem-a2485-default-rtdb.firebaseio.com",
});

// Routes

// Example Route
app.get('/', (req, res) => {
  res.send('Node.js server with Firebase Admin SDK is running!');
});

// Example: Fetch Firebase Firestore Data
app.get('/data', async (req, res) => {
  const db = admin.firestore();
  try {
    const snapshot = await db.collection('exampleCollection').get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    res.status(500).send('Error fetching data: ' + error.message);
  }
});

// Add User Route
app.post('/add-user', async (req, res) => {
  const {
    email,
    password,
    username,
    region,
    province,
    municipalityCity,
    usertype,
    isActive,
  } = req.body;

  try {
    //  Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });
    const userId = userRecord.uid;

    // Add user to Firestore
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.set({
      email,
      username,
      region,
      province,
      municipalityCity,
      usertype,
      isActive,
    });

    // Add "firestationReports" documents if usertype is "fire-stations"
    if (usertype === 'fire-stations') {
      const firestationCollections = [
        'firestationReportsDeposits',
        'firestationReportsCollections',
        'firestationReportsOfficers',
      ];
      const batch = db.batch();
      firestationCollections.forEach((collection) => {
        const docRef = db.collection(collection).doc(userId);
        batch.set(docRef, {
          email,
          username,
          region,
          province,
          municipalityCity,
        });
      });
      await batch.commit();
    }

    // Add user to Realtime Database
    const realtimeDb = admin.database();
    const userRef = realtimeDb.ref(`activeUsers/${userId}`);
    await userRef.set({
      isActive,
      lastActive: new Date().toISOString(),
    });

    // Respond 
    res.status(200).json({ message: 'User created successfully', userId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});


app.delete('/delete-user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const db = admin.firestore();
    const realtimeDb = admin.database();

    //Delete user from Firestore
    await db.collection('users').doc(userId).delete();

    //Delete related Firestore documents 
    const firestationCollections = ['firestationReportsDeposits', 'firestationReportsCollections', 'firestationReportsOfficers'];
    const batch = db.batch();
    firestationCollections.forEach((collection) => {
      const docRef = db.collection(collection).doc(userId);
      batch.delete(docRef);
    });
    await batch.commit();

    // Delete user from Realtime Db
    const userRef = realtimeDb.ref(`activeUsers/${userId}`);
    await userRef.remove();

    //Delete user from Authentication
    await admin.auth().deleteUser(userId);

    res.status(200).json({ message: 'User successfully deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
