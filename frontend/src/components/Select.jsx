import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Styled replacement for <select>. The option list is portaled to <body> with fixed
// positioning so it is never clipped by a scrolling modal, and it opens upward when
// there is not enough room below the trigger.
export default function Select({ id, value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);

  const openList = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setPosition(null);
    setOpen(true);
  };

  const choose = (index) => {
    const option = options[index];
    if (option && option.value !== value) {
      onChange(option.value);
    }
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Position the list against the trigger before paint, and keep it attached on scroll/resize
  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const list = listRef.current;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < list.offsetHeight + gap * 2 && rect.top > spaceBelow;
      setPosition({
        top: openUpward ? rect.top - list.offsetHeight - gap : rect.bottom + gap,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - list.offsetWidth - 8)),
        minWidth: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  // Close when clicking anywhere outside the trigger and the list
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e) => {
      if (buttonRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        // Firefox fires a click on Space keyup even when keydown was prevented
        onKeyUp={(e) => e.key === ' ' && e.preventDefault()}
        className={`flex items-center justify-between gap-3 text-left bg-white/[0.03] border rounded-lg text-white font-light focus:outline-none focus:border-white/[0.25] transition-colors duration-200 ${
          open ? 'border-white/[0.25]' : 'border-white/[0.08]'
        } ${className}`}
      >
        {/* Every label sits in the same grid cell so the trigger is as wide as the longest option */}
        <span className="grid min-w-0">
          {options.map((option, index) => (
            <span
              key={option.value}
              aria-hidden={index !== selectedIndex}
              className={`col-start-1 row-start-1 truncate ${index === selectedIndex ? '' : 'invisible'}`}
            >
              {option.label}
            </span>
          ))}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={id}
            className="fixed z-[70] max-h-64 overflow-y-auto bg-black border border-white/[0.08] rounded-xl p-1 shadow-2xl shadow-black"
            style={position ?? { top: 0, left: 0, visibility: 'hidden' }}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(index)}
                className={`flex items-center justify-between gap-6 px-3 py-2 text-sm font-light whitespace-nowrap rounded-lg cursor-pointer transition-colors duration-150 ${
                  index === activeIndex ? 'bg-white/[0.06] text-white' : index === selectedIndex ? 'text-white' : 'text-gray-300'
                }`}
              >
                {option.label}
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${index === selectedIndex ? 'text-white' : 'invisible'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
}
