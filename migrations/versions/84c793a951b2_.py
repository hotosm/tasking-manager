"""empty message

Revision ID: 84c793a951b2
Revises: 772aff899389
Create Date: 2019-11-12 20:04:46.065237

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = "84c793a951b2"
down_revision = "29097876c7e6"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.Column("unread_count", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="notifications_pkey"),
    )
    op.create_index(
        "idx_notifications_user_id", "notifications", ["user_id"], unique=False
    )
    fetch_all_users = "select id from users;"
    all_users = conn.execute(fetch_all_users)
    for user in all_users:
        user_id = user[0]
        insert_user_info = (
            "insert into notifications (user_id,unread_count,date) values ("
            + str(user_id)
            + ","
            + str(0)
            + ",'"
            + str(datetime.now())
            + "');"
        )
        op.execute(insert_user_info)

    fetch_all_unread_counts = "select to_user_id, count(*) from messages where read = false group by to_user_id;"
    unread_counts = conn.execute(fetch_all_unread_counts)
    for unread_count in unread_counts:
        user_id = unread_count[0]
        user_unread_count = unread_count[1]
        update_notification_info = (
            "update notifications set user_id ="
            + str(user_id)
            + ",unread_count = "
            + str(user_unread_count)
            + ",date = '"
            + str(datetime.now())
            + "' where user_id = "
            + str(user_id)
            + ";"
        )

        op.execute(update_notification_info)


def downgrade():
    op.drop_index("idx_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")
