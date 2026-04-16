const test = `
  useEffect(() => {
    const handleFocusIn = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) {
        setIsKeyboardOpen(true);
        setIsOpen(false); // also ensure drawer is closed
      }
    };
    const handleFocusOut = () => setIsKeyboardOpen(false);

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    // Check for modals dynamically based on z-[2000]
    const checkModals = () => {
      const hasModal = document.querySelector('.z-\\\\[2000\\\\]');
      if (hasModal && !isKeyboardOpen) {
         setIsKeyboardOpen(true);
         setIsOpen(false);
      }
    };
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      observer.disconnect();
    };
  }, [isKeyboardOpen]);
`;
