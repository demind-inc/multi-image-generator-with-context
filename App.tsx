import React, { useState, useEffect, useRef } from 'react';
import { ImageSize, SceneResult, ReferenceImage } from './types';
import { generateCharacterScene, generateSlideshowStructure } from './services/geminiService';
import ApiKeyGuard from './components/ApiKeyGuard';
import './App.scss';

type AppMode = 'slideshow' | 'manual';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [mode, setMode] = useState<AppMode>('slideshow');
  const [topic, setTopic] = useState<string>('');
  const [manualPrompts, setManualPrompts] = useState<string>('Boy looking confused with question marks around him\nBoy feeling lonely at a cafe table\nBoy looking angry while listening to something');
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [slideshowResults, setSlideshowResults] = useState<SceneResult[]>([]);
  const [manualResults, setManualResults] = useState<SceneResult[]>([]);
  const [size, setSize] = useState<ImageSize>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingStoryboard, setIsCreatingStoryboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferences((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReference = (id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  const handleGenerateStoryboard = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic first.');
      return;
    }
    setIsCreatingStoryboard(true);
    try {
      const slides = await generateSlideshowStructure(topic);
      if (slides.length > 0) {
        const newResults: SceneResult[] = slides.map((slide, idx) => ({
          title: slide.title,
          description: slide.description,
          prompt: slide.prompt,
          isLoading: false,
          isCTA: idx === slides.length - 1,
        }));
        setSlideshowResults(newResults);
      }
    } catch (error) {
      console.error('Storyboard error:', error);
      alert('Failed to generate storyboard. Check your connection/key.');
    } finally {
      setIsCreatingStoryboard(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    if (references.length === 0) {
      alert('Please upload at least one reference image for character consistency.');
      return;
    }

    const setter = mode === 'slideshow' ? setSlideshowResults : setManualResults;
    const currentList = mode === 'slideshow' ? slideshowResults : manualResults;
    const targetResult = currentList[index];

    if (!targetResult || targetResult.isCTA) return;

    setter((prev) => prev.map((res, idx) => (idx === index ? { ...res, isLoading: true, error: undefined } : res)));

    try {
      const imageUrl = await generateCharacterScene(targetResult.prompt, references, size);
      setter((prev) => prev.map((res, idx) => (idx === index ? { ...res, imageUrl, isLoading: false } : res)));
    } catch (error: any) {
      console.error('Regeneration error:', error);
      if (error.message === 'KEY_NOT_FOUND') {
        setHasKey(false);
      }
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index ? { ...res, error: error.message || 'Generation failed', isLoading: false } : res
        )
      );
    }
  };

  const startGeneration = async () => {
    if (references.length === 0) {
      alert('Please upload at least one reference image for character consistency.');
      return;
    }

    setIsGenerating(true);

    if (mode === 'manual') {
      const promptList = manualPrompts.split('\n').filter((p) => p.trim() !== '');
      if (promptList.length === 0) {
        alert('Please enter some manual prompts.');
        setIsGenerating(false);
        return;
      }

      const initialManualResults = promptList.map((p) => ({ prompt: p, isLoading: true } as SceneResult));
      setManualResults(initialManualResults);

      for (let i = 0; i < initialManualResults.length; i++) {
        try {
          const imageUrl = await generateCharacterScene(promptList[i], references, size);
          setManualResults((prev) => prev.map((res, idx) => (idx === i ? { ...res, imageUrl, isLoading: false } : res)));
        } catch (error: any) {
          console.error('Manual generation error:', error);
          if (error.message === 'KEY_NOT_FOUND') {
            setHasKey(false);
            break;
          }
          setManualResults((prev) =>
            prev.map((res, idx) => (idx === i ? { ...res, error: error.message, isLoading: false } : res))
          );
        }
      }
    } else {
      if (slideshowResults.length === 0) {
        alert('Please create a storyboard first.');
        setIsGenerating(false);
        return;
      }

      setSlideshowResults((prev) => prev.map((res) => ({ ...res, isLoading: !res.isCTA && !res.imageUrl })));

      for (let i = 0; i < slideshowResults.length; i++) {
        const currentRes = slideshowResults[i];
        if (currentRes.isCTA || currentRes.imageUrl) continue;

        try {
          const imageUrl = await generateCharacterScene(currentRes.prompt, references, size);
          setSlideshowResults((prev) => prev.map((res, idx) => (idx === i ? { ...res, imageUrl, isLoading: false } : res)));
        } catch (error: any) {
          console.error('Slideshow generation error:', error);
          if (error.message === 'KEY_NOT_FOUND') {
            setHasKey(false);
            break;
          }
          setSlideshowResults((prev) =>
            prev.map((res, idx) => (idx === i ? { ...res, error: error.message, isLoading: false } : res))
          );
        }
      }
    }

    setIsGenerating(false);
  };

  if (hasKey === false) {
    return <ApiKeyGuard onKeySelected={() => setHasKey(true)} />;
  }

  if (hasKey === null) {
    return (
      <div className="app app--loading">
        <div className="loading-screen">
          <div className="loading-screen__spinner" />
          <p className="loading-screen__text">Checking API configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-content">
          <div className="brand">
            <div className="brand__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="brand__title">Consistency Studio</h1>
          </div>

          <div className="mode-toggle">
            <div className="mode-toggle__inner">
              <button
                onClick={() => setMode('slideshow')}
                className={`mode-toggle__button ${mode === 'slideshow' ? 'is-active' : ''}`}
              >
                Slideshow Mode
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`mode-toggle__button ${mode === 'manual' ? 'is-active' : ''}`}
              >
                Manual Generation
              </button>
            </div>
          </div>

          <div className="header-actions">
            <div className="size-picker">
              <span>Res</span>
              <div className="size-picker__options">
                {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    disabled={isGenerating}
                    className={`size-picker__option ${size === s ? 'is-active' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startGeneration} disabled={isGenerating || references.length === 0} className="primary-button">
              {isGenerating ? 'Processing...' : 'Generate Images'}
            </button>
          </div>
        </div>
      </header>

      <main className="app__body">
        <div className="sidebar custom-scrollbar">
          <section className="card">
            <div className="card__header">
              <h3 className="card__title">References</h3>
              <button onClick={() => fileInputRef.current?.click()} className="card__action">
                Upload
              </button>
            </div>
            <input type="file" ref={fileInputRef} multiple className="hidden-input" accept="image/*" onChange={handleFileUpload} />
            {references.length === 0 ? (
              <div onClick={() => fileInputRef.current?.click()} className="references__placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <div>Add Character Images</div>
              </div>
            ) : (
              <div className="references__grid">
                {references.map((ref) => (
                  <div key={ref.id} className="reference-thumb">
                    <img src={ref.data} alt="Reference" />
                    <button onClick={() => removeReference(ref.id)} className="reference-thumb__remove" aria-label="Remove reference">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {mode === 'slideshow' ? (
              <>
                <h3 className="card__title">Slideshow Story</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div>
                    <label className="field-label">Overall Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Benefits of Yoga"
                      className="text-input"
                    />
                  </div>
                  <button
                    onClick={handleGenerateStoryboard}
                    disabled={isCreatingStoryboard || !topic.trim()}
                    className="storyboard-button"
                  >
                    {isCreatingStoryboard ? 'Creating Script...' : 'Generate Storyboard'}
                  </button>
                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <p className="helper-text">This will automatically create a title slide, informative slides, and a CTA slide.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="card__title">Manual Scenarios</h3>
                <textarea
                  value={manualPrompts}
                  onChange={(e) => setManualPrompts(e.target.value)}
                  placeholder="One scene prompt per line..."
                  className="textarea-input"
                />
                <p className="helper-text">Describe actions, emotions, and props.</p>
              </>
            )}
          </section>
        </div>

        <div className="app__results">
          <div className="results-card">
            <div className="results-card__header">
              <span>{mode === 'slideshow' ? 'Slideshow Timeline' : 'Generated Scenes'}</span>
              {isGenerating && <span className="badge">Rendering set...</span>}
            </div>

            <div className="results-card__body">
              {(mode === 'slideshow' ? slideshowResults : manualResults).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="brand__title" style={{ fontSize: '18px', color: '#475569' }}>No Content Ready</p>
                  <p className="helper-text" style={{ margin: 0 }}>
                    Upload references and {mode === 'slideshow' ? 'create a storyboard' : 'input prompts'}
                  </p>
                </div>
              ) : (
                <div className="results-scroll custom-scrollbar">
                  <div className="results-list">
                    {(mode === 'slideshow' ? slideshowResults : manualResults).map((result, idx) => {
                      const isFirstSlide = mode === 'slideshow' && idx === 0;
                      return (
                        <div key={idx} className={`slide-card ${result.isCTA ? 'slide-card--cta' : ''}`}>
                          {!result.isCTA && (
                            <div className="slide-card__media">
                              {result.isLoading ? (
                                <div className="slide-card__overlay slide-card__overlay--loading">
                                  <div className="spinner" />
                                  <p className="helper-text" style={{ margin: 0, color: '#2563eb' }}>Illustrating...</p>
                                </div>
                              ) : result.imageUrl ? (
                                <>
                                  <img src={result.imageUrl} alt={`Result ${idx + 1}`} className="slide-card__image" />
                                  <div className="slide-card__actions">
                                    <button
                                      onClick={() => handleRegenerate(idx)}
                                      className="icon-button"
                                      title="Regenerate this scene"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    </button>
                                    <a
                                      href={result.imageUrl}
                                      download={`scene-${idx + 1}.png`}
                                      className="icon-button"
                                      title="Download PNG"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4-4 4m0 0-4-4m4 4V4" />
                                      </svg>
                                    </a>
                                  </div>
                                </>
                              ) : result.error ? (
                                <div className="slide-card__overlay slide-card__overlay--error">
                                  <p className="helper-text" style={{ margin: 0, color: '#b91c1c' }}>Error</p>
                                  <p className="slide-card__prompt" style={{ color: '#ef4444', fontStyle: 'italic' }}>
                                    "{result.error}"
                                  </p>
                                  <button
                                    onClick={() => handleRegenerate(idx)}
                                    className="storyboard-button"
                                    style={{ background: '#ef4444', boxShadow: '0 12px 22px rgba(239, 68, 68, 0.26)' }}
                                  >
                                    Retry
                                  </button>
                                </div>
                              ) : (
                                <div className="slide-card__overlay slide-card__overlay--placeholder">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <div className="helper-text" style={{ margin: 0, color: '#cbd5e1' }}>Awaiting Generation</div>
                                </div>
                              )}
                            </div>
                          )}

                          {result.isCTA && (
                            <div className="cta-placeholder">
                              <div>
                                <div style={{ marginBottom: '12px' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4-4 4m0 0-4-4m4 4V4" />
                                  </svg>
                                </div>
                                <div>Action Slide</div>
                              </div>
                            </div>
                          )}

                          <div className="slide-card__meta">
                            <span className="slide-card__index">{idx + 1}</span>
                            <h3 className="slide-card__title">
                              {result.title || (mode === 'manual' ? `Scene ${idx + 1}` : `Slide ${idx + 1}`)}
                            </h3>
                          </div>

                          {!isFirstSlide && result.description && (
                            <p className="slide-card__description">{result.description}</p>
                          )}

                          {mode === 'manual' && <p className="slide-card__description">{result.prompt}</p>}

                          {!result.isCTA && (
                            <div className="slide-card__foot">
                              <div className="slide-card__foot-label">Character Guidance</div>
                              <p className="slide-card__foot-text">"{result.prompt}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer__content">
          <p>© 2024 Consistency Studio — Gemini 3 Pro Engine</p>
          <div className="footer__status">
            <span>
              <span className="status-dot status-dot--green" />
              Character Identity Locked
            </span>
            <span>
              <span className="status-dot status-dot--blue" />
              Lifestack Slideshow Optimized
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
