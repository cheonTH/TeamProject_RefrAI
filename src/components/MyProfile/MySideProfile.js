// src/components/common/MySideProfile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MySideProfile.css";
import AxiosInstance from "../pages/AxiosInstance";

const MySideProfile = ({onLogout, isLoggined}) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [nickName, setNickName] = useState("");
  const [veganType, setVeganType] = useState(""); // 'vegan' | 'non-vegan'
  const [foodOptions, setFoodOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const waitForToken = async (timeoutMs = 4000, stepMs = 100) => {
   const start = Date.now();
   while (Date.now() - start < timeoutMs) {
     const t = sessionStorage.getItem("token");
     if (t) return t;
     await new Promise(r => setTimeout(r, stepMs));
   }
   return null;
 };

  useEffect(() => {
    let active = true;

    // 비로그인이면 호출 스킵
    
    (async () => {
     // 로그인 안 됐으면 초기화
     if (!isLoggined) {
       if (active) {
         setEmail(""); setNickName(""); setVeganType(""); setFoodOptions([]);
         setLoading(false);
       }
       return;
     }

     // 토큰이 없으면 잠시 대기(조기 교환이 끝나길)
     let jwt = sessionStorage.getItem("token") || await waitForToken(2500);
     if (!jwt) {
       if (active) setLoading(false);
       return;
     }

      try {
        const res = await AxiosInstance.get("/api/users/me");
        const data = res.data;

        if (!active) return;
        setEmail(data.email || "");
        setNickName(data.nickName || "");
        setVeganType(data.veganType || "");
        setFoodOptions(Array.isArray(data.foodOptions) ? data.foodOptions : []);
      } catch (e) {
        if (!active) return;
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [isLoggined]);

  const toKo = (v) => (v === "non-vegan" ? "논비건" : v === "vegan" ? "비건" : v || "-");

  const handleLogout = () => {
    // 세션 스토리지 정리
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("nickname");
    sessionStorage.removeItem("userId");
    // 혹시 남아있을지 모르는 옛 키 제거
    sessionStorage.removeItem("jwtToken");

    onLogout()

    navigate("/login");
  };

  return (
    <aside className="side-profile">
      <h3 className="side-profile__title">내 정보</h3>

      {loading ? (
        <>
          <div className="side-profile__row">
            <span className="side-profile__label">닉네임</span>
            <span className="side-profile__value">불러오는 중…</span>
          </div>
          <div className="side-profile__row">
            <span className="side-profile__label">이메일</span>
            <span className="side-profile__value">불러오는 중…</span>
          </div>
          <div className="side-profile__row">
            <span className="side-profile__label">비건 타입</span>
            <span className="side-profile__value">불러오는 중…</span>
          </div>
        </>
      ) : (
        <>
          <div className="side-profile__row">
            <span className="side-profile__label">닉네임</span>
            <span className="side-profile__value">{nickName || "-"}</span>
          </div>
          <div className="side-profile__row">
            <span className="side-profile__label">이메일</span>
            <span className="side-profile__value">{email || "-"}</span>
          </div>
          <div className="side-profile__row">
            <span className="side-profile__label">비건 타입</span>
            <span className="side-profile__value">{toKo(veganType)}</span>
          </div>

          {veganType === "non-vegan" && (
            <div className="side-profile__row">
              <span className="side-profile__label">선호 음식</span>
              <span className="side-profile__value">
                {foodOptions?.length ? (
                  <div className="side-profile__tags">
                    {foodOptions.map((f, i) => (
                      <span key={i} className="side-profile__tag">{f}</span>
                    ))}
                  </div>
                ) : (
                  "선택된 카테고리 없음"
                )}
              </span>
            </div>
          )}
        </>
      )}

      <hr className="side-profile__divider" />

      <div className="side-profile__actions">
        <button className="btn btn--primary" onClick={() => navigate("/my-page")}>마이페이지</button>
        <button className="btn btn--ghost" onClick={handleLogout}>로그아웃</button>
      </div>
    </aside>
  );
};

export default MySideProfile;
