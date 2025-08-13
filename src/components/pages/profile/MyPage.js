// src/components/pages/profile/MyPage.js
import React, { useEffect, useState } from "react"; // 'react'에 따옴표 확인
import styled from "styled-components";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom"; 
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'; 
import AxiosInstance from "../AxiosInstance";

const Container = styled.div`
    max-width: 1200px;
    margin: 40px auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    min-height: 70vh; 
    display: flex;
    flex-direction: column; /* 메인 레이아웃을 세로로 변경 */
`;

const NavList = styled.nav`
    display: flex;
    justify-content: left;
    gap: 10px;
    margin-bottom: 20px;
    padding: 10px 20px;
    border-radius: 8px;
`;

const NavLink = styled(Link)`
    display: block;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    padding: 12px 20px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 1.1em;
    color: #555;
    text-decoration: none;
    transition: background-color 0.3s, color 0.3s;
    text-align: center;
    font-weight: normal;

    &:hover {
        background-color: #e0e0e0;
        color: #555;
    }

    &.active {
        background-color: #ffc06d;
        color: white;
        border-color: #ffc06d;
        font-weight: bold;
    }
`;

const Content = styled.div`
    flex: 1;
    padding: 30px 40px;
    background-color: #f9f9f9;
    border-radius: 0 8px 8px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
`;

const ContentHeader = styled.h2`
    text-align: left;
    font-size: 40px;
    color: #ffc06d;
    margin-bottom: 20px;
    margin-left : 20px;
`;

const InfoBox = styled.div`
     width: 100%;
    margin: 0 auto;
    padding: 20px 30px;
    /* background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); */
    /* border-radius: 12px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
    border-top: 5px solid #FF8C00; */
    border: 1px solid #eee;
    border-radius: 8px;
    background-color: #fafafa;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    text-align: center;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: left;
    align-items: center;
    margin-bottom: 10px;
`;

const Label = styled.span`
    font-size: 16px;
    font-weight: bold;
    color: #555;
`;

const Value = styled.span`
    font-size: 16px;
    color: #333;
`;

const Text = styled.p`
    display: flex;
    justify-content: left;
    font-size: 16px;
    font-weight: bold;
    color: #555;
`

const MyPage = ({ db, auth, userId, userProfile, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [email, setEmail] = useState('');
    const [nickName, setNickName] = useState('');
    const [gender, setGender] = useState('');
    const [veganType, setVeganType] = useState('');
    const [foodOptions, setFoodOptions] = useState([]);

    const isNavLinkActive = (path) => location.pathname.startsWith(path);
    const isMyPageHome = location.pathname === '/my-page' || location.pathname === '/my-page/';

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await AxiosInstance.get('api/users/me');
                const fetchedProfile = response.data;

                setEmail(fetchedProfile.email || '');
                setNickName(fetchedProfile.nickName || '');
                setGender(fetchedProfile.gender || '');
                setVeganType(fetchedProfile.veganType || '');
                setFoodOptions(fetchedProfile.foodOptions || []);

            } catch (error) {
                
            }
        };

        if (userId && db && foodOptions) {
            fetchUserData();
        }

    }, [userId, db, foodOptions]); 

    return (
        <Container>
            <ContentHeader>마이페이지</ContentHeader>
            <NavList>
                <NavLink to="/my-page" className={isNavLinkActive("/my-page") && isMyPageHome ? "active" : ""}>
                    마이페이지
                </NavLink>
                <NavLink to="/my-page/info-edit" className={isNavLinkActive("/my-page/info-edit") ? "active" : ""}>
                    개인 정보 수정
                </NavLink>
                <NavLink to="/my-page/delete-account" className={isNavLinkActive("/my-page/delete-account") ? "active" : ""}>
                    회원 탈퇴
                </NavLink>
            </NavList>
            <Content>
                {isMyPageHome ? (
                    <>
                        <InfoBox>
                            <InfoRow>
                                <Label>닉네임 : </Label>
                                <Value>{nickName}</Value>
                            </InfoRow>
                            <InfoRow>
                                <Label>이메일 : </Label>
                                <Value>{email}</Value>
                            </InfoRow>
                            <InfoRow>
                                <Label>성별 : </Label>
                                <Value>{gender}</Value>
                            </InfoRow>
                            <InfoRow>
                                <Label>음식 성향 : </Label>
                                <Value>{veganType === 'non-vegan' ? '논비건' : veganType === 'vegan' ? '비건' : veganType}</Value>
                            </InfoRow>
                            {veganType === 'non-vegan' &&(
                                <>
                                    <InfoRow>
                                        <Label>선호음식 카테고리</Label>
                                    </InfoRow>
                                    {foodOptions.length > 0 ? (
                                        foodOptions.map((food, index) => (
                                            <Text key={index}> • {food}</Text>
                                            ))
                                        ) : (
                                            <Label>선택된 카테고리 없음</Label>
                                    )}
                                </>
                            )}
                        </InfoBox>
                    </>
                ) : (
                    <Outlet /> 
                )}
            </Content>
        </Container>
    );
};

export default MyPage;