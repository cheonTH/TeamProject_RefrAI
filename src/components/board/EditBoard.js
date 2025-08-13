import { useContext, useEffect, useState } from "react";
import './Board.css';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { BoardContext } from "./context/BoardContext";

const BoardEdit = () => {
    const [title, setTitle] = useState('');
    const [email, setEmail] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [cookingTime, setCookingTime] = useState('');
    const [category, setCategory] = useState('');
    const [mainImage, setMainImage] = useState(null);
    const [steps, setSteps] = useState([{ text: '', image: null }]);

    const springBackendUrl = process.env.REACT_APP_SPRING_BACKEND_URL;

    const { boardList, setBoardList } = useContext(BoardContext);
    const navigate = useNavigate();
    const { id } = useParams();

    // 이미지 리사이즈 함수
    const resizeImage = (file, maxWidth, maxHeight, callback) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // 비율 유지하며 크기 조정
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", 0.7); // JPEG 품질 70%
                callback(dataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        axios.get(`${springBackendUrl}/api/board/${id}`)
            .then((res) => {
                const post = res.data;
                setTitle(post.title);
                setEmail(post.email);
                setContent(post.content);
                setIngredients(post.ingredients || '');
                setDifficulty(post.difficulty || '');
                setCookingTime(post.cookingTime || '');
                setCategory(post.category || '');

                if (post.imageUrls && post.imageUrls.length > 0) {
                    setMainImage({ file: null, url: post.imageUrls[0] });
                }

                if (post.recipeSteps && post.recipeSteps.length > 0) {
                    setSteps(post.recipeSteps.map(step => ({
                        text: step.text,
                        image: step.imageUrl ? { file: null, url: step.imageUrl } : null
                    })));
                }
            })
            .catch(err => {
                console.error("게시글 불러오기 실패:", err);
                navigate("/community");
            });
    }, [id, navigate]);

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        resizeImage(file, 800, 800, (resizedDataUrl) => {
            setMainImage({ file, url: resizedDataUrl });
        });
    };

    const handleStepChange = (index, field, value) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    const handleStepImageChange = (index, file) => {
        if (!file) return;
        resizeImage(file, 800, 800, (resizedDataUrl) => {
            handleStepChange(index, "image", { file, url: resizedDataUrl });
        });
    };

    const handleAddStep = () => {
        setSteps([...steps, { text: '', image: null }]);
    };

    const handleRemoveStep = (index) => {
        if (index === 0) {
            alert("첫 번째 설명은 삭제할 수 없습니다.");
            return;
        }
        setSteps(steps.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const nickName = sessionStorage.getItem("nickname");

        const updatedPost = {
            title,
            email,
            content: category === "질문" ? content : "",
            difficulty,
            cookingTime,
            category,
            ingredients,
            imageUrls: mainImage ? [mainImage.url] : [],
            recipeSteps: steps.map(step => ({
                text: step.text,
                imageUrl: step.image?.url || null
            })),
            writingTime: new Date().toLocaleString(),
            nickName
        };

        try {
            const token = sessionStorage.getItem("token");
            if (!token) {
                return;
            }

            await axios.put(`${springBackendUrl}/api/board/${id}`, updatedPost, {
                headers: { Authorization: `Bearer ${token}` },
            });
            navigate(`/community/${id}`);
        } catch (err) {
            console.error("게시글 수정 실패:", err);
        }
    };

    const handleCancel = () => navigate(-1);

    return (
        <div className="write-form-edit">
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="category-select-edit"
            >
                <option value="">카테고리 선택</option>
                <option value="한식">한식</option>
                <option value="중식">중식</option>
                <option value="일식">일식</option>
                <option value="양식">양식</option>
                <option value="디저트">디저트</option>
                <option value="질문">질문</option>
                <option value="(아기)이유식">(아기)이유식</option>
                <option value="(아기)밥">(아기)밥</option>
            </select>

            <input
                type="text"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            {category !== '질문' && (
                <>
                    <textarea
                        placeholder="재료를 입력해주세요 (예: 감자 2개, 당근 1개)"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                    />

                    <div className="thumbnail-image-edit">
                        <p>대표 이미지 업로드</p>
                        <input type="file" accept="image/*" onChange={handleMainImageChange} />
                        {mainImage && <img src={mainImage.url} alt="대표 이미지" className="preview-image-edit" />}
                    </div>

                    <div className="write-options-container-edit">
                        <div className="write-options-edit">
                            <label>난이도:</label>
                            {['상', '중', '하'].map(level => (
                                <label key={level}>
                                    <input
                                        type="radio"
                                        name="difficulty"
                                        value={level}
                                        checked={difficulty === level}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                    />
                                    {level}
                                </label>
                            ))}
                        </div>

                        <div className="cooking-time-section-edit">
                            <input
                                type="number"
                                placeholder="시간(분)"
                                value={cookingTime}
                                onChange={(e) => setCookingTime(e.target.value)}
                                min="5"
                                className="styled-input-edit"
                            />
                            <p>분</p>
                        </div>
                    </div>

                    <h2 className="recipe-info-title-edit">레시피 설명</h2>
                    {steps.map((step, index) => (
                        <div key={index} className="step-input-edit">
                            <textarea
                                placeholder={`Step ${index + 1} 설명`}
                                value={step.text}
                                onChange={(e) => handleStepChange(index, "text", e.target.value)}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleStepImageChange(index, e.target.files[0])}
                                className="recipe-text-file-edit"
                            />
                            {step.image && <img src={step.image.url} alt={`step-${index}`} className="preview-image-edit" />}
                            {index !== 0 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveStep(index)}
                                    className="recipe-file-delete-edit"
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={handleAddStep} className="add-step-button-edit">설명 추가</button>
                </>
            )}

            {category === '질문' && (
                <div className="qustion-content-edit">
                    <textarea
                        placeholder="내용을 입력하세요"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <input type="file" accept="image/*" onChange={handleMainImageChange} />
                    {mainImage && <img src={mainImage.url} alt="대표 이미지" className="preview-image-edit" />}
                </div>
            )}

            <div>
                <button onClick={handleSubmit}>수정 완료</button>
                <button style={{ marginLeft: 10 }} onClick={handleCancel}>취소</button>
            </div>
        </div>
    );
};

export default BoardEdit;
