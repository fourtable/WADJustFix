<template>
    <div>
        <button class="btn btn-primary btn-sm table-button mb-2 mb-lg-0" @click="openPopup">
            Review
        </button>
        <div v-if="show" class="modal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Leave a Review</h5>
                        <span type="button" class="close" @click="closePopup">
                            <span>&times;</span>
                        </span>
                    </div>
                    <div class="modal-body">
                        <div class="reviewer-info" style="text-align: center;">
                            <img :src="this.revieweePhoto" alt="Reviewer Picture" class="reviewer-picture" />
                            <p><strong> {{ this.revieweeName }}</strong></p>
                        </div>
                        <div class="rating" @mouseleave="resetHoverRating">
                            <label>Rating:</label>
                            <div class="star-rating" style="display: inline;">
                                <span v-for="star in 5" :key="star" class="star" @mouseover="hoverRating = star"
                                    @click="setRating(star)">
                                    {{ star <= (hoverRating || rating) ? '★' : '☆' }} <!-- Use filled star or hollow
                                        star -->
                                </span>
                            </div>
                            <input type="hidden" v-model="rating" required />
                        </div>

                        <div class="comments">
                            <label for="comments">Comments:</label>
                            <textarea v-model="comments" required class="form-textarea"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" @click="resetReviewForm">Reset</button>
                        <button type="button" class="btn btn-success" @click="submitReview">Submit</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { db } from '../main';
import { ref } from 'vue';
import { collection, onSnapshot, query, where, getDocs, getDoc, doc, updateDoc, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import Cookies from 'js-cookie';

export default {
    props: ['quote'],
    data() {
        return {
            show: false,
            rating: 0,
            hoverRating: null,
            comments: '',
            revieweePhoto: '',
        };
    },
    computed: {
        uid() {
            return Cookies.get('uid') || sessionStorage.getItem('uid');
        },
        userName() {
            return Cookies.get('username') || sessionStorage.getItem('username');
        },
        revieweeName() {
            if (this.quote.repairerId == this.uid) {
                this.fetchRevieweeImageUrl(this.quote.userId);
                return this.quote.userName;
            }
            else {
                this.fetchRevieweeImageUrl(this.quote.repairerId);
                return this.quote.repairerName;
            }
        },
    },
    methods: {
        openPopup() {
            this.show = true;
        },
        closePopup() {
            this.show = false;
        },
        resetReviewForm() {
            this.rating = 0;
            this.comments = '';
        },
        setRating(n) {
            this.rating = n; // Set the selected rating
        },
        resetHoverRating() {
            this.hoverRating = null; // Reset hover rating
        },
        async submitReview() {
            const revieweeID = ref();
            const revieweeName = ref();
            const reviewerID = ref();
            const reviewerName = ref();
            if (this.quote.repairerId == this.uid) {
                reviewerID.value = this.uid;
                reviewerName.value = this.userName;
                revieweeID.value = this.quote.userId;
                revieweeName.value = this.quote.userName;
            }
            else {
                reviewerID.value = this.uid;
                reviewerName.value = this.userName;
                revieweeID.value = this.quote.repairerId;
                revieweeName.value = this.quote.repairerName;
            }
            const reviewData = {
                reviewerID: reviewerID.value,
                reviewerName: reviewerName.value,
                revieweeID: revieweeID.value,
                revieweeName: revieweeName.value,
                rating: this.rating,
                comments: this.comments,
                quoteId: this.quote.id,
                createdAt: new Date().toLocaleDateString(),
            };
            try {
                const reviewsCollection = collection(db, "reviews");
                const pointCollection = collection(db, 'points');
                await addDoc(pointCollection, {
                    Date: serverTimestamp(),
                    UID: this.uid,
                    points: 10,
                    type: "earn",
                });
                await addDoc(reviewsCollection, reviewData);
                console.log("Review submitted:", reviewData);
                // Reset the form
                this.resetReviewForm();
                this.closePopup();
            }
            catch (error) {
                console.log("Error: ", error);
            }
        },
        async fetchRevieweeImageUrl(uid) {
            try {
                const userDocRef = doc(db, "users", uid); // Reference to the user's document in Firestore
                const userDoc = await getDoc(userDocRef); // Fetch the document
                if (userDoc.exists()) {
                    this.revieweePhoto = userDoc.data().imageUrl; // Get the imageUrl from the user document
                } else {
                    console.error("No such document!");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        },
    }
};
</script>

<style scoped>
.modal {
    display: flex;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
}

.modal-dialog {
    min-width: 50vw;
    /* Increase width */
    min-height: 50vh;
    /* Increase height */
}

.modal-content {
    background-color: white;
    margin: auto;
    padding: 20px;
    border: 1px solid #888;
    width: 40vw;
    max-width: 60vw;
    max-height: 90vh;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.rating .comments {
    font-size: 36px;
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.close:hover,
.close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
}

.star-rating {
    display: flex;
    cursor: pointer;
}

.star {
    font-size: 30px;
    /* Adjust star size */
    color: #ffd700;
    /* Default color for empty stars */
    transition: color 0.2s;
}

label {
    font-weight: bold;
    margin-right: 2%;
    font-size: 24px;
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
    border-color: #007bff;
    /* Bootstrap primary color */
    outline: none;
    /* Remove outline */
}

.form-textarea {
    height: 20vh;
    /* Set a height for the textarea */
}

.btn-primary {
    align-self: flex-end;
    /* Align button to the right */
}

.reviewer-picture {
    max-width: 100%;
    /* Allow the image to scale down to the container's width */
    height: auto;
    /* Maintain aspect ratio */
    width: 150px;
    /* Set a default width */
    border-radius: 50%;
    /* Optional: to make it circular */
}

/* For large screens (lg) */
@media (max-width: 1199px) {

    /* 992px to 1199px */
    .reviewer-picture {
        width: 120px;
        /* Adjust size for lg */
    }
}

/* For medium screens (md) */
@media (max-width: 991px) {

    /* 768px to 991px */
    .reviewer-picture {
        width: 100px;
        /* Adjust size for md */
    }
}

/* For small screens (sm) */
@media (max-width: 767px) {

    /* 576px to 767px */
    .reviewer-picture {
        width: 80px;
        /* Adjust size for sm */
    }
}

/* For extra small screens (xs) */
@media (max-width: 575px) {

    /* Less than 576px */
    .reviewer-picture {
        width: 70px;
        /* Adjust size for xs */
    }
}
</style>
