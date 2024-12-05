const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.addUser = functions.https.onCall(async (data, context) => {
  // Ensure the request is authenticated
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Only administrators can create new users.",
    );
  }

  const {email, password, username, usertype, region, province, city} = data;

  if (!email || !password || !username || !usertype) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields.",
    );
  }

  try {
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    const userId = userRecord.uid;

    // Add user to Firestore
    const userDocRef = admin.firestore().doc(`users/${userId}`);
    await userDocRef.set({
      email,
      username,
      region,
      province,
      municipalityCity: city,
      usertype,
      isActive: false, // Default inactive status
    });

    // Add user
    if (usertype === "fire-stations") {
      const firestationDocs = [
        admin.firestore().doc(`firestationReportsDeposits/${userId}`),
        admin.firestore().doc(`firestationReportsCollections/${userId}`),
        admin.firestore().doc(`firestationReportsOfficers/${userId}`),
      ];

      for (const ref of firestationDocs) {
        await ref.set({
          email,
          username,
          region,
          province,
          municipalityCity: city,
        });
      }
    }

    // Add user to Realtime Database
    const userRef = admin.database().ref(`activeUsers/${userId}`);
    await userRef.set({
      isActive: false,
      lastActive: new Date().toISOString(),
    });

    return {success: true, userId};
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Unable to create the user.",
    );
  }
});
