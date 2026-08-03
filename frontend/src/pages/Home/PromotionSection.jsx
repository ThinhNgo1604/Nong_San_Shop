import React from "react";

// ============ DỮ LIỆU KHUYẾN MÃI ============
// Phần này hiển thị tĩnh (không click/điều hướng). Ảnh dùng nguồn free-license
// (Pexels). Sau này nếu cần, có thể thay bằng ảnh thật của shop hoặc fetch
// từ API "/api/promotions" (Node.js + SQL Server).
const promotions = [
  {
    id: 1,
    image:
      "https://images.pexels.com/photos/3978831/pexels-photo-3978831.jpeg?auto=compress&cs=tinysrgb&w=800",
    badgeType: "tag",
    badgeText: "Free ship",
    title: "Miễn phí vận chuyển",
    desc: "Bán kính <5km",
  },
  {
    id: 2,
    image:
      "https://images.pexels.com/photos/3999498/pexels-photo-3999498.jpeg?auto=compress&cs=tinysrgb&w=800",
    badgeType: "tag",
    badgeText: "Rau củ",
    title: "Rau củ VietGAP",
    desc: "Chuẩn an toàn thực phẩm",
  },
  {
    id: 3,
    image:
      "https://images.pexels.com/photos/8289906/pexels-photo-8289906.jpeg?auto=compress&cs=tinysrgb&w=800",
    badgeType: "percent",
    badgeText: "-10%",
    title: "Giảm ngay 10%",
    desc: "Cho 100 khách đặt hàng đầu tiên",
  },
  {
    id: 4,
    image:
      "https://images.pexels.com/photos/351679/pexels-photo-351679.jpeg?auto=compress&cs=tinysrgb&w=800",
    badgeType: "percent",
    badgeText: "-20%",
    title: "Chiết khấu 20%",
    desc: "Chương trình tuyển đại lý",
  },
];

export default function PromotionSection() {
  return (
    <section className="km-section">
      <div className="km-header">
        <div>
          <h2 className="km-heading">Chương Trình Khuyến Mãi</h2>
          <div className="km-underline" />
        </div>
        
      </div>

      <div className="km-grid">
        {promotions.map((promo) => (
          <div className="km-card" key={promo.id}>
            <div className="km-card-image">
              <img
                src={promo.image}
                alt={promo.title}
                className="km-card-img"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x220?text=Nong+San+Shop";
                }}
              />
              <div className="km-card-overlay" />

              {promo.badgeType === "tag" && (
                <span className="km-card-chip">{promo.badgeText}</span>
              )}
              {promo.badgeType === "percent" && (
                <span className="km-card-percent">{promo.badgeText}</span>
              )}
            </div>
            <div className="km-card-body">
              <h3 className="km-card-title">{promo.title}</h3>
              <p className="km-card-desc">{promo.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .km-section {
          max-width: 1200px;
          margin: 50px auto;
          padding: 0 20px;
        }

        .km-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .km-heading {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #1B4332;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .km-underline {
          width: 200px;
          height: 3px;
          background: #40916C;
          margin-top: 10px;
          border-radius: 2px;
        }

        .km-see-more {
          font-size: 14px;
          font-weight: 600;
          color: #2D6A4F;
          text-decoration: none;
          white-space: nowrap;
          transition: color 0.2s ease;
        }

        .km-see-more span {
          margin-left: 4px;
        }

        .km-see-more:hover {
          color: #1B4332;
          text-decoration: underline;
        }

        .km-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .km-card {
          display: block;
          background: #fff;
          border: 1px solid #EDF3ED;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(27, 67, 50, 0.06);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .km-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 30px rgba(27, 67, 50, 0.12);
          border-color: #B7DCC3;
        }

        .km-card-image {
          position: relative;
          height: 170px;
          overflow: hidden;
        }

        .km-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .km-card:hover .km-card-img {
          transform: scale(1.06);
        }

        .km-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(8,28,21,0) 55%, rgba(8,28,21,0.35) 100%);
        }

        .km-card-chip {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.95);
          color: #1B4332;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 999px;
        }

        .km-card-percent {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #D62828;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          border: 2px dashed rgba(255, 255, 255, 0.7);
        }

        .km-card-body {
          padding: 16px 18px 20px;
        }

        .km-card-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #1B4332;
        }

        .km-card-desc {
          font-size: 13px;
          color: #666;
          margin: 0;
        }

        @media (max-width: 900px) {
          .km-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .km-heading {
            font-size: 21px;
          }
        }

        @media (max-width: 520px) {
          .km-grid {
            grid-template-columns: 1fr;
          }
          .km-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </section>
  );
}