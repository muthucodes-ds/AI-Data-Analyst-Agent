from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class UploadedFile(Base):

    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    total_rows = Column(Integer)

    total_columns = Column(Integer)

    column_names = Column(JSON)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
