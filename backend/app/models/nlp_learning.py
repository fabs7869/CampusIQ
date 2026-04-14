import uuid
from sqlalchemy import Column, String, Integer, Enum as SAEnum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from app.models.complaint import ComplaintCategory

class NLPLearnedKeyword(Base):
    __tablename__ = "nlp_learned_keywords"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    word = Column(String(100), nullable=False, index=True)
    category = Column(SAEnum(ComplaintCategory), nullable=False)
    count = Column(Integer, default=1)

    __table_args__ = (UniqueConstraint('word', 'category', name='_word_category_uc'),)
