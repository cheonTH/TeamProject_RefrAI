import { useContext, useState } from "react";
import './Board.css';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { BoardContext } from "./context/BoardContext";

const BoardWrite = () => {
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [category, setCategory] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [steps, setSteps] = useState([{ text: '', image: null }]);

  const email = sessionStorage.getItem('email');
  const { boardList, setBoardList } = useContext(BoardContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const springBackendUrl = process.env.REACT_APP_SPRING_BACKEND_URL;

  // 이미지 리사이즈 함수
  const resizeImage = (file, maxWidth, maxHeight, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 비율 유지하며 리사이즈
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        // Canvas로 축소
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG로 압축, 0.7 품질
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

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
    if (category === "질문" || category === "notice") {
      if (!title || !content) {
        alert("제목과 내용을 입력해주세요.");
        return;
      }
    } else {
      if (!title || !difficulty || !cookingTime || !category || !ingredients || !mainImage) {
        alert("모든 항목을 입력해주세요.");
        return;
      }
    }

    const email = sessionStorage.getItem("email");
    const nickName = sessionStorage.getItem("nickName");

    if (!email || !nickName) {
      alert("로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    const newPost = {
      title,
      content: ['질문', 'notice'].includes(category) ? content : "",
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
      likeCount: 0,
      isLiked: false,
      email,
      nickName
    };

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await axios.post(
        `${springBackendUrl}/api/board`,
        newPost,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const savedPost = response.data;
      setBoardList([savedPost, ...boardList]);

      setTitle('');
      setContent('');
      setIngredients('');
      setMainImage(null);
      setSteps([{ text: '', image: null }]);

      alert("게시글이 성공적으로 등록되었습니다.");
      navigate(`/community`);
    } catch (err) {
      console.error("게시글 등록 실패:", err);
      alert("게시글 등록 중 오류가 발생했습니다.");
    }
  };

  const handleCancel = () => {
    navigate('/community');
  };

  return (
    <div className="write-form">
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-select">
        <option value="">카테고리 선택</option>
        <option value="한식">한식</option>
        <option value="중식">중식</option>
        <option value="일식">일식</option>
        <option value="양식">양식</option>
        <option value="디저트">디저트</option>
        <option value="질문">질문</option>
        <option value="(아기)이유식">(아기)이유식</option>
        <option value="(아기)밥">(아기)밥</option>
        {email === 'refrmanager00@gmail.com' && <option value="notice">공지사항</option>}
      </select>

      <input type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />

      {!['질문', 'notice'].includes(category) && (
        <>
          <textarea
            placeholder="재료를 입력해주세요 (예: 감자 2개, 당근 1개)"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />

          <div className="thumbnail-image">
            <p>대표 이미지 업로드</p>
            <input type="file" accept="image/*" onChange={handleMainImageChange} />
            {mainImage && <img src={mainImage.url} alt="대표 이미지" className="preview-image" />}
          </div>

          <div className="write-options-container">
            <div className="write-options">
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

            <div className="cooking-time-section">
              <input
                type="number"
                placeholder="시간(분)"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                min="5"
                className="styled-input"
              />
              <p>분</p>
            </div>
          </div>

          <h2 className="recipe-info-title">레시피 설명</h2>
          {steps.map((step, index) => (
            <div key={index} className="step-input">
              <textarea
                placeholder={`Step ${index + 1} 설명`}
                value={step.text}
                onChange={(e) => handleStepChange(index, "text", e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleStepImageChange(index, e.target.files[0])}
                className="recipe-text-file"
              />
              {step.image && (
                <img src={step.image.url} alt={`step-${index}`} className="preview-image" />
              )}
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="recipe-file-delete"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddStep} className="add-step-button">설명 추가</button>
        </>
      )}

      {['질문', 'notice'].includes(category) && (
        <div className="qustion-content">
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input type="file" accept="image/*" onChange={handleMainImageChange} />
          {mainImage && <img src={mainImage.url} alt="대표 이미지" className="preview-image" />}
        </div>
      )}

      <div>
        <button onClick={handleSubmit}>작성 완료</button>
        <button style={{ marginLeft: 10 }} onClick={handleCancel}>취소</button>
      </div>
    </div>
  );
};

export default BoardWrite;
