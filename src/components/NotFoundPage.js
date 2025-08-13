// src/components/NotFoundPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    text-align: center;
    background-color: #f8f8f8;
    color: #333;
    padding: 20px;
`;

const NotFoundTitle = styled.h1`
    font-size: 5em;
    color: #FF8C00;
    margin-bottom: 0.2em;
`;

const NotFoundMessage = styled.p`
    font-size: 1.5em;
    margin-bottom: 1.5em;
`;

const GoHomeLink = styled(Link)`
    display: inline-block;
    padding: 12px 25px;
    background-color: #FF8C00;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-size: 1.1em;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: #e67e00;
    }
`;

const NotFoundPage = () => {
    return (
        <NotFoundContainer>
            <NotFoundTitle>404</NotFoundTitle>
            <NotFoundMessage>페이지를 찾을 수 없습니다.</NotFoundMessage>
            <p>요청하신 페이지가 존재하지 않거나, 잘못된 경로입니다.</p>
            <GoHomeLink to="/">홈으로 돌아가기</GoHomeLink>
        </NotFoundContainer>
    );
};

export default NotFoundPage;
