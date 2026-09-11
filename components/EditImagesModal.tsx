import React, { useRef, useState } from 'react';
import Modal from './Modal';
import { ASSET_SLOTS } from '../constants';
import { generateImageVariants } from './imageProcessor';
import { DownloadIcon } from './Icons';

type UploadType = 'title' | 'textbox' | 'pixel' | 'sprite';

interface EditImagesModalProps {
  onClose: () => void;
  onApply: (images: (string | null)[]) => void;
  images: (string | null)[];
  type: UploadType;
  title: string;
}

const padArray = (arr: (string | null)[], length: number): (string | null)[] => {
  const newArr: (string | null)[] = [...arr];
  while (newArr.length < length) {
    newArr.push(null);
  }
  return newArr.slice(0, length);
};

const EditImagesModal: React.FC<EditImagesModalProps> = ({ onClose, onApply, images, type, title }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [currentImages, setCurrentImages] = useState<(string | null)[]>(images);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const IMAGES_PER_PAGE = 6;
  const totalPages = Math.ceil(ASSET_SLOTS / IMAGES_PER_PAGE);
  const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;

  const handleUploadClick = (index: number) => {
    if (imageInputRef.current) {
      imageInputRef.current.setAttribute('data-upload-index', String(index));
      imageInputRef.current.click();
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const indexStr = event.target.getAttribute('data-upload-index');
    const index = indexStr ? parseInt(indexStr, 10) : undefined;

    if (file && type && index !== undefined) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (typeof e.target?.result === 'string') {
          const dataUrl = e.target.result;
          const shouldGenerateVariants = (type === 'title' || type === 'textbox');

          if (shouldGenerateVariants) {
            setIsProcessing(true);
            try {
              const variants = await generateImageVariants(dataUrl);
              const newImages = [dataUrl, ...variants];
              setCurrentImages(padArray(newImages, ASSET_SLOTS));
            } catch (error) {
              console.error("Failed to generate image variants:", error);
              alert("No se pudieron generar las variantes de la imagen. Por favor, intenta con otra imagen.");
              const newImages = padArray([], ASSET_SLOTS);
              newImages[0] = dataUrl;
              setCurrentImages(newImages);
            } finally {
              setIsProcessing(false);
            }
          } else {
            setCurrentImages(prev => {
              const newImages = [...prev];
              newImages[index] = dataUrl;
              return newImages;
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }

    if (event.target) {
        event.target.value = '';
    }
  };
  
  const handleApply = () => {
    onApply(currentImages);
    onClose();
  };

  const handleExport = () => {
    const imagesToExport = currentImages.filter((img): img is string => !!img);

    if (imagesToExport.length === 0) {
        alert("No hay imágenes para exportar.");
        return;
    }
    
    try {
        const jsonString = JSON.stringify(imagesToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixelboard_${type}_collection.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to generate JSON file:", error);
        alert("Ocurrió un error al crear el archivo JSON.");
    }
  };
  
  const handleLoadClick = () => {
      jsonInputRef.current?.click();
  };
  
  const handleJsonFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("File is not text");

              const parsed = JSON.parse(text);
              if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string' || item === null)) {
                  throw new Error("Invalid JSON format. Expected an array of strings.");
              }
              
              const loadedImages = parsed.filter(item => typeof item === 'string' && item.startsWith('data:image'));
              setCurrentImages(padArray(loadedImages as string[], ASSET_SLOTS));
          } catch (error) {
              console.error("Failed to load or parse asset file:", error);
              alert("Error al cargar el archivo de assets. Asegúrate de que es un archivo JSON válido exportado desde Pixel Board.");
          }
      };
      reader.onerror = () => {
          console.error("Failed to read the file.");
          alert("Ocurrió un error al leer el archivo.");
      }
      reader.readAsText(file);

      if (event.target) {
          event.target.value = '';
      }
  };

  const handleDownloadImage = (imgSrc: string, index: number) => {
    const link = document.createElement('a');
    link.href = imgSrc;
    const mimeType = imgSrc.substring(5, imgSrc.indexOf(';'));
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `pixelboard_${type}_slot_${index + 1}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Modal onClose={onClose} title={title}>
      <input 
        type="file" 
        ref={imageInputRef} 
        className="hidden" 
        onChange={handleImageFileChange} 
        accept="image/png, image/jpeg, image/gif"
      />
       <input
        type="file"
        ref={jsonInputRef}
        className="hidden"
        onChange={handleJsonFileLoad}
        accept="application/json"
      />
      <div className="relative">
         {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[var(--z-modal-nested)]">
            <p className="text-3xl animate-pulse">Procesando...</p>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {/* Top Controls */}
          <div className="flex justify-center gap-4">
            <button onClick={handleLoadClick} className="pixel-button px-4 py-2 text-xl bg-blue-600 hover:bg-blue-500">
                Cargar Colección
            </button>
            <button onClick={handleExport} className="pixel-button px-4 py-2 text-xl bg-yellow-600 hover:bg-yellow-500">
                Exportar Colección
            </button>
          </div>

          <hr className="pixel-divider" />
          
          {/* Image Grid */}
          <div className="grid grid-cols-3 gap-4 min-h-[340px] content-start">
            {Array.from({ length: IMAGES_PER_PAGE }).map((_, i) => {
              const index = startIndex + i;
              if (index >= ASSET_SLOTS) return null;
              const imgSrc = currentImages[index];
              return (
                <div key={index} className="pixel-content-box flex flex-col items-center justify-between gap-2 p-2">
                  <div 
                    className="w-full h-24 flex items-center justify-center cursor-pointer"
                    onClick={() => handleUploadClick(index)}
                    title="Haz clic para subir"
                  >
                    {imgSrc ? (
                      <img src={imgSrc} alt={`Slot ${index + 1}`} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-gray-400 text-2xl">Vacío</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 w-full">
                    <span className="text-lg">Espacio {index + 1}</span>
                    <div className="flex items-center gap-1 w-full">
                      <button onClick={() => handleUploadClick(index)} className="pixel-button text-lg w-full p-1 flex-grow">
                        Subir
                      </button>
                      {imgSrc && (
                        <button onClick={() => handleDownloadImage(imgSrc, index)} className="pixel-button p-1" title="Descargar Imagen">
                          <DownloadIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <hr className="pixel-divider" />
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => handlePageChange(currentPage - 1)} className="pixel-button px-4 py-1 text-lg" disabled={currentPage === 1}>
                    Anterior
                </button>
                <span className="text-xl">Página {currentPage} de {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} className="pixel-button px-4 py-1 text-lg" disabled={currentPage === totalPages}>
                    Siguiente
                </button>
              </div>
            </>
          )}
          
          <hr className="pixel-divider" />
          
          {/* Bottom Controls */}
          <div className="flex justify-center items-center gap-4">
            <button onClick={onClose} className="pixel-button px-6 py-2 flex items-center gap-2 text-2xl bg-red-700 hover:bg-red-600">
              Cancelar
            </button>
            <button onClick={handleApply} className="pixel-button px-6 py-2 flex items-center gap-2 text-2xl bg-green-700 hover:bg-green-600">
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditImagesModal;