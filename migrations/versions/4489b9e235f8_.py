"""Allow deleting a level with no users but with votes
Revision ID: 4489b9e235f8
Revises: d289a8a785b9
Create Date: 2025-08-22 13:43

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "4489b9e235f8"
down_revision = "d289a8a785b9"
branch_labels = None
depends_on = None


def upgrade():
    # user_next_level
    # level_id
    op.execute(
        "alter table user_next_level drop constraint user_next_level_level_id_fkey"
    )
    op.execute(
        "alter table user_next_level add constraint user_next_level_level_id_fkey foreign key (level_id) references mapping_levels (id) on delete cascade"
    )
    # user_id
    op.execute(
        "alter table user_next_level drop constraint user_next_level_user_id_fkey"
    )
    op.execute(
        "alter table user_next_level add constraint user_next_level_user_id_fkey foreign key (user_id) references users (id) on delete cascade"
    )
    # user_level_vote
    # level_id
    op.execute(
        "alter table user_level_vote drop constraint user_level_vote_level_id_fkey"
    )
    op.execute(
        "alter table user_level_vote add constraint user_level_vote_level_id_fkey foreign key (level_id) references mapping_levels (id) on delete cascade"
    )
    # user_id
    op.execute(
        "alter table user_level_vote drop constraint user_level_vote_user_id_fkey"
    )
    op.execute(
        "alter table user_level_vote add constraint user_level_vote_user_id_fkey foreign key (user_id) references users (id) on delete cascade"
    )
    # voter_id
    op.execute(
        "alter table user_level_vote drop constraint user_level_vote_voter_id_fkey"
    )
    op.execute(
        "alter table user_level_vote add constraint user_level_vote_voter_id_fkey foreign key (voter_id) references users (id) on delete cascade"
    )


def downgrade():
    # user_next_level
    # level_id
    op.execute(
        "alter table user_next_level drop constraint user_next_level_level_id_fkey"
    )
    op.execute(
        "alter table user_next_level add constraint user_next_level_level_id_fkey foreign key (level_id) references mapping_levels (id) on delete restrict"
    )
    # user_id
    op.execute(
        "alter table user_next_level drop constraint user_next_level_user_id_fkey"
    )
    op.execute(
        "alter table user_next_level add constraint user_next_level_user_id_fkey foreign key (user_id) references users (id) on delete restrict"
    )
    # user_level_vote
    # level_id
    op.execute(
        "alter table user_level_vote drop constraint user_level_vote_level_id_fkey"
    )
    op.execute(
        "alter table user_level_vote add constraint user_level_vote_level_id_fkey foreign key (level_id) references mapping_levels (id) on delete restrict"
    )
    # user_id
    op.execute(
        "alter table user_level_vote drop constraint user_level_vote_user_id_fkey"
    )
    op.execute(
        "alter table user_level_vote add constraint user_level_vote_user_id_fkey foreign key (user_id) references users (id) on delete restrict"
    )
    # voter_id
    op.execute(
        "alter table user_level_vote drop constraint user_level_vote_voter_id_fkey"
    )
    op.execute(
        "alter table user_level_vote add constraint user_level_vote_voter_id_fkey foreign key (voter_id) references users (id) on delete restrict"
    )
