"""
种子脚本 - 初始化学校数据

使用方法：
    python scripts/seed_schools.py
    python scripts/seed_schools.py --file schools.json
"""

import argparse
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.school import School

# 默认学校列表
DEFAULT_SCHOOLS = [
    {"school_id": "SCH_DEFAULT", "school_name": "默认学校"},
    {"school_id": "SCH_BJU", "school_name": "北京联合大学"},
    {"school_id": "SCH_THU", "school_name": "清华大学"},
    {"school_id": "SCH_PKU", "school_name": "北京大学"},
    {"school_id": "SCH_ZJU", "school_name": "浙江大学"},
    {"school_id": "SCH_SJTU", "school_name": "上海交通大学"},
    {"school_id": "SCH_FDU", "school_name": "复旦大学"},
    {"school_id": "SCH_NJU", "school_name": "南京大学"},
    {"school_id": "SCH_WHU", "school_name": "武汉大学"},
    {"school_id": "SCH_HUST", "school_name": "华中科技大学"},
    {"school_id": "SCH_SCU", "school_name": "四川大学"},
]


def seed_schools(schools_data: list):
    """批量插入学校数据"""
    db = SessionLocal()
    try:
        created = 0
        skipped = 0
        for s in schools_data:
            existing = db.query(School).filter(School.school_id == s["school_id"]).first()
            if existing:
                skipped += 1
                continue
            school = School(
                school_id=s["school_id"],
                school_name=s["school_name"],
                is_active=True,
            )
            db.add(school)
            created += 1

        db.commit()
        print(f"学校数据初始化完成：新增 {created}，跳过 {skipped}")

    except Exception as e:
        db.rollback()
        print(f"初始化失败：{e}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="初始化学校数据")
    parser.add_argument("--file", help="学校数据JSON文件路径（可选）")
    args = parser.parse_args()

    # 确保数据库表存在
    Base.metadata.create_all(bind=engine)

    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            schools_data = json.load(f)
        print(f"从文件加载学校数据: {args.file}")
    else:
        schools_data = DEFAULT_SCHOOLS
        print("使用默认学校列表")

    seed_schools(schools_data)
