const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Initialize the Express app
const app = express();

// Use CORS to allow cross-origin requests
app.use(cors({ origin: true })); // This will allow all origins

// Your POST endpoint for signup
app.post('/signup', async (req, res) => {
    try {
        // Your signup logic here
        // Example:
        const userRecord = await admin.auth().createUser({
            email: req.body.email,
            password: req.body.password,
            displayName: req.body.name,
        });

        res.status(200).send({ message: 'User created successfully!', user: userRecord });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error creating user' });
    }
});

// Endpoint to add an item to the user's cart
app.post('/addToCart', async (req, res) => {
    try {
        const { userId, item } = req.body;  // userId and item should be passed in the request body

        const cartRef = admin.firestore().collection('carts').doc(userId);

        // Get the current cart data
        const cartDoc = await cartRef.get();
        let cartData = cartDoc.exists ? cartDoc.data() : { items: [] };

        // Add the new item to the cart
        cartData.items.push(item);

        // Update the cart in Firestore
        await cartRef.set(cartData);

        res.status(200).send({ message: 'Item added to cart successfully!', cart: cartData });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error adding item to cart' });
    }
});

// Endpoint to remove an item from the user's cart
app.post('/removeFromCart', async (req, res) => {
    try {
        const { userId, itemName } = req.body;  // userId and itemName should be passed in the request body

        const cartRef = admin.firestore().collection('carts').doc(userId);

        // Get the current cart data
        const cartDoc = await cartRef.get();
        if (!cartDoc.exists) {
            return res.status(404).send({ error: 'Cart not found' });
        }

        let cartData = cartDoc.data();
        let updatedItems = cartData.items.filter(item => item.name !== itemName); // Filter out the item to be removed

        // Update the cart in Firestore
        await cartRef.set({ items: updatedItems });

        res.status(200).send({ message: 'Item removed from cart successfully!', cart: { items: updatedItems } });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error removing item from cart' });
    }
});


// Endpoint to add a comment to a product
app.post('/addComment', async (req, res) => {
    try {
        const { productId, commentText, userId } = req.body;  // productId, commentText, and userId should be passed in the request body

        // Reference to the comments collection for the specific product
        const commentsRef = admin.firestore().collection('products').doc(productId).collection('comments');

        // Add the comment to Firestore
        await commentsRef.add({
            userId: userId,
            comment: commentText,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).send({ message: 'Comment added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error adding comment' });
    }
});

// Endpoint to get all comments for a specific product
app.get('/getComments/:productId', async (req, res) => {
    try {
        const productId = req.params.productId; // Get the productId from URL parameter

        // Reference to the comments collection for the specific product
        const commentsSnapshot = await admin.firestore().collection('products').doc(productId).collection('comments').get();

        // Prepare the comments data to return
        const comments = [];
        commentsSnapshot.forEach(doc => {
            const commentData = doc.data();
            comments.push({
                userId: commentData.userId,
                comment: commentData.comment,
                timestamp: commentData.timestamp.toDate(), // Convert timestamp to JS Date
            });
        });

        res.status(200).send({ comments: comments });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error fetching comments' });
    }
});


// Export the app to Firebase
exports.signupuser = functions.https.onRequest(app);
exports.cartApi = functions.https.onRequest(app);
exports.commentsApi = functions.https.onRequest(app);

