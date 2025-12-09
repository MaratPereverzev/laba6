"""create initial tables

Revision ID: 0001_create_tables
Revises: 
Create Date: 2025-12-07
"""
from alembic import op
import sqlalchemy as sa
from sqlmodel import SQLModel

# revision identifiers, used by Alembic.
revision = '0001_create_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    # create all tables using SQLModel metadata
    from app import models
    SQLModel.metadata.create_all(bind=bind)


def downgrade():
    bind = op.get_bind()
    from app import models
    SQLModel.metadata.drop_all(bind=bind)
