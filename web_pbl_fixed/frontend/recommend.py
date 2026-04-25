from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)
CORS(app)

# ✅ Connect to your MongoDB — change the DB name if needed
client = MongoClient("mongodb://localhost:27017")
db = client["edulinkdb"]        # 🔁 replace with your actual DB name
events_collection = db["events"]   # 🔁 replace with your actual collection name


def get_recommendations(event_id, top_n=3):

    # Fetch all events from MongoDB
    all_events = list(events_collection.find({}))

    if len(all_events) < 2:
        return []

    # Build a text corpus — combine title + description + category for each event
    corpus = []
    ids = []

    for e in all_events:
        text = f"{e.get('title', '')} {e.get('description', '')} {e.get('category', '')}"
        corpus.append(text)
        ids.append(str(e["_id"]))

    # TF-IDF vectorization
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # Find index of the requested event
    if event_id not in ids:
        return []

    idx = ids.index(event_id)

    # Compute cosine similarity of this event against all others
    similarities = cosine_similarity(tfidf_matrix[idx], tfidf_matrix).flatten()

    # Get top N most similar (exclude itself — index 0 after sorting)
    similar_indices = np.argsort(similarities)[::-1]
    similar_indices = [i for i in similar_indices if i != idx][:top_n]

    recommendations = []
    for i in similar_indices:
        e = all_events[i]
        recommendations.append({
            "id": str(e["_id"]),
            "title": e.get("title", ""),
            "category": e.get("category", ""),
            "startDate": str(e.get("startDate", "")),
        })

    return recommendations


@app.route("/recommend", methods=["GET"])
def recommend():
    event_id = request.args.get("id")

    if not event_id:
        return jsonify({"error": "No event id provided"}), 400

    results = get_recommendations(event_id)
    return jsonify(results)


if __name__ == "__main__":
    app.run(port=5000, debug=True)