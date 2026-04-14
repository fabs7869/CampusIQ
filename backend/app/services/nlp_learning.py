import re
from sqlalchemy.orm import Session
from app.models.nlp_learning import NLPLearnedKeyword
from app.models.complaint import ComplaintCategory

# Words to ignore for learning (noisy/generic tokens)
LEARNING_STOP_WORDS = {
    "is", "the", "a", "an", "this", "that", "those", "these", "am", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "to", "from", "at", "on", "in", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below", "off", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "can", "will", "just", "should", "now", "it", "problem", "issue", "reported", "complaint"
}

def update_brain(db: Session, description: str, category: ComplaintCategory):
    """
    Online learning logic that updates word-category frequencies.
    """
    if not description or len(description.strip()) < 5:
        return
        
    description = description.lower().strip()
    clean_desc = re.sub(r'[^\w\s]', ' ', description)
    tokens = [t for t in clean_desc.split() if len(t) > 3 and t not in LEARNING_STOP_WORDS]
    
    for word in set(tokens):
        # Check if this word-category pair exists
        kw = db.query(NLPLearnedKeyword).filter(
            NLPLearnedKeyword.word == word,
            NLPLearnedKeyword.category == category
        ).first()
        
        if kw:
            kw.count += 1
        else:
            new_kw = NLPLearnedKeyword(word=word, category=category, count=1)
            db.add(new_kw)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Data Science Learning sync failed: {e}")
