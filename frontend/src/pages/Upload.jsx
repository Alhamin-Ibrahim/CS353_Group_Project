import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, storage } from '../firebase';
import './Upload.css';

const DESCRIPTION_LIMIT = 300;

function Upload() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleDescriptionChange = (e) => setDescription(e.target.value);
  const handleCategoryChange = (e) => setCategory(e.target.value);
  const handlePriceChange = (e) => setPrice(e.target.value);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    if (files.length + selectedFiles.length > 5) {
      setError("You can only upload 5 images maximum");
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    setError("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(file => 
      file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg'
    );

    if (imageFiles.length === 0) {
      setError("Please drop image files only (PNG, JPG, JPEG)");
      return;
    }

    if (imageFiles.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    if (files.length + imageFiles.length > 5) {
      setError("You can only upload 5 images maximum");
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...imageFiles]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevents double submissions (e.g user spamming upload button)
    if (isUploading) {
      return;
    }

    if (!files.length) {
      setError("Please select at least one image");
      return;
    }

    if (files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    if (!description || !category || !price) {
      setError("Please enter all fields");
      return;
    }

    if (!auth.currentUser?.emailVerified) {
      setError("Please verify your email in settings");
      return;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));

    if (numericPrice > 2000) {
      setError("Price cannot exceed €2000");
      return;
    }

    setIsUploading(true);

    try {
      const uid = auth.currentUser?.uid || 'anon';
      const displayName =
        auth.currentUser?.displayName ||
        auth.currentUser?.email ||
        'Anonymous';

      const uploadPromises = files.map(async (file) => {
        const imageRef = ref(storage, `items/${uid}/${Date.now()}-${file.name}`);
        await uploadBytes(imageRef, file);
        return getDownloadURL(imageRef);
      });

      const imageUrls = await Promise.all(uploadPromises);

      await addDoc(collection(db, "items"), {
        imageUrls,
        description,
        category,
        priceText: price,
        price: isNaN(numericPrice) ? null : numericPrice,
        createdAt: serverTimestamp(),
        userId: uid,
        username: displayName,
      });

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        setIsUploading(false);
        navigate('/profile');
      }, 2000);
    } catch (err) {
      console.error("Error: ", err);
      setError(err.message);
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="upload-page">
      <div className="upload-card-wrapper">
        <div className="upload-card">
          <h1 className="upload-title">Upload Item</h1>

          <form onSubmit={handleSubmit} className="upload-form">
          
            {/* Image Upload  fixes the drag and drop on image not working */}
            <div
              className={`upload-image-area ${files.length > 0 ? 'has-files' : ''} ${isDragging ? 'dragging' : ''}`}
              data-file-count={files.length}
              onClick={() => document.getElementById("fileInput").click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            > 
              {files.length === 0 ? (
                <div className="upload-placeholder">
                  <p>Click or drag to upload images (Max: 5)</p>
                </div>
              ) : (
                files.map((file, i) => (
                  <div key={i} className="image-preview-wrapper">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview-${i}`}
                      className="upload-preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(i);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
              <input
                id="fileInput"
                type="file"
                accept=".png, .jpg, .jpeg"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            {error && <p className="upload-error">{error}</p>}

            {files.length > 0 && (
              <p className="file-count">{files.length}/5 images selected</p>
            )}

            {/* Description */}
            <label className="upload-label" htmlFor="description">Item Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              maxLength={DESCRIPTION_LIMIT}
              rows={4}
              className="upload-textarea"
              placeholder="Describe your item..."
              required
            />

            <p className="char-count">
              {description.length} / {DESCRIPTION_LIMIT} characters
            </p>

            {/* Price */}
            <label className="upload-label" htmlFor="price">Item Price (€):</label>
            <textarea
              id="price"
              value={price}
              onChange={handlePriceChange}
              rows={2}
              className="upload-textarea price-textarea"
              placeholder="Enter price (e.g. 50 or Negotiable)"
              required
            />

            {/* Category */}
            <label className="upload-label" htmlFor="category">Select Category:</label>
            <select
              id="category"
              value={category}
              onChange={handleCategoryChange}
              className="upload-select"
              required
            >
              <option value="">-- Select a category --</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="accessories">Accessories</option>
              <option value="ticket">Tickets & Events</option>
              <option value="textbooks">Books & Materials</option>
              <option value="other">Other</option>
            </select>

            <button type="submit" className="upload-button" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon">✓</div>
            <h2>Success!</h2>
            <p>Item uploaded successfully!</p>
            <div className="success-loader"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;
