import styled from 'styled-components';
import { Link } from 'react-router-dom';

const MembershipContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 800px;
    margin: 40px auto;
    text-align: center;
`;

const MembershipTitle = styled.h2`
    font-size: 2.5em;
    color: #FF8C00;
    margin-bottom: 25px;
`;

const MembershipDescription = styled.p`
    font-size: 1.2em;
    color: #555;
    line-height: 1.6;
    margin-bottom: 30px;
`;

const MembershipTier = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: #fff;
    width: 100%;
    max-width: 300px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const TierName = styled.h3`
    font-size: 1.8em;
    color: #333;
    margin-bottom: 10px;
`;

const TierImage = styled.img`
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 50%;
    margin-bottom: 15px;
    border: 2px solid #FF8C00;
`;

const TierBenefits = styled.ul`
    list-style: none;
    padding: 0;
    text-align: left;
    width: 100%;
    font-size: 1em;
    color: #666;
`;

const BenefitItem = styled.li`
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    &::before {
        content: '✔️';
        margin-right: 8px;
        color: green;
    }
`;

const BackLink = styled(Link)`
    display: inline-block;
    padding: 12px 25px;
    background-color: #FF8C00;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-size: 1.1em;
    transition: background-color 0.3s ease;
    margin-top: 20px;

    &:hover {
        background-color: #e67e00;
    }
`;


const MemberShip = () => {
    return (
        <MembershipContainer>
            <MembershipTitle>멤버십 등급 설명</MembershipTitle>
            <MembershipDescription>
                저희 서비스의 멤버십 등급에 따라 다양한 혜택을 누려보세요!
                활동 점수를 쌓아 더 높은 등급으로 올라갈 수 있습니다.
            </MembershipDescription>

            <MembershipTier>
                <TierName>브론즈</TierName>
                <TierImage src="https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg?semt=ais_hybrid&w=740" alt="브론즈 등급" />
                <TierBenefits>
                    <BenefitItem>기본 레시피 생성 (일 5회)</BenefitItem>
                    <BenefitItem>게시글 작성 및 댓글 기능</BenefitItem>
                </TierBenefits>
            </MembershipTier>

            <MembershipTier>
                <TierName>실버</TierName>
                <TierImage src="https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg?semt=ais_hybrid&w=740" alt="실버 등급" />
                <TierBenefits>
                    <BenefitItem>레시피 무제한 생성</BenefitItem>
                    <BenefitItem>레시피 저장 기능</BenefitItem>
                    <BenefitItem>월 1회 스페셜 레시피 추천</BenefitItem>
                </TierBenefits>
            </MembershipTier>

            <MembershipTier>
                <TierName>골드</TierName>
                <TierImage src="https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg?semt=ais_hybrid&w=740" alt="골드 등급" />
                <TierBenefits>
                    <BenefitItem>모든 실버 혜택 포함</BenefitItem>
                    <BenefitItem>개인 맞춤형 식단 추천 (주 1회)</BenefitItem>
                    <BenefitItem>프리미엄 요리 가이드 접근</BenefitItem>
                </TierBenefits>
            </MembershipTier>

            <BackLink to="/my-page">마이페이지로 돌아가기</BackLink>
        </MembershipContainer>
    );
}

export default MemberShip;