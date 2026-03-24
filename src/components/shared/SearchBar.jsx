import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const matchesCaseQuery = (caseItem, rawQuery) => {
  const normalizedQuery = rawQuery.trim().toLowerCase();
  const compactQuery = normalizedQuery.replace(/[^a-z0-9]/gi, '');
  if (!normalizedQuery) return false;

  return [
    caseItem?.title,
    caseItem?.caseNumber,
    caseItem?.description,
    caseItem?.status
  ]
    .filter(Boolean)
    .some((value) => {
      const plainValue = String(value).toLowerCase();
      const compactValue = plainValue.replace(/[^a-z0-9]/gi, '');
      return plainValue.includes(normalizedQuery) || compactValue.includes(compactQuery);
    });
};

function SearchBar({ className = '', placeholder = 'Search across all cases and documents...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ cases: [], documents: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ cases: [], documents: [] });
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        const casesResponse = await fetch('http://localhost:5000/api/cases', {
          credentials: 'include'
        });
        const allCases = await casesResponse.json().catch(() => []);

        if (!casesResponse.ok) {
          throw new Error('Unable to fetch cases');
        }

        const normalizedQuery = query.trim().toLowerCase();
        const compactQuery = normalizedQuery.replace(/[^a-z0-9]/gi, '');
        const caseResults = Array.isArray(allCases)
          ? allCases
              .filter((caseItem) => matchesCaseQuery(caseItem, query))
              .slice(0, 8)
              .map((caseItem) => ({
                _id: caseItem._id,
                title: caseItem.title,
                caseNumber: caseItem.caseNumber,
                description: caseItem.description,
                status: caseItem.status
              }))
          : [];

        const documentResults = Array.isArray(allCases)
          ? allCases
              .flatMap((caseItem) =>
                (caseItem.documents || [])
                  .filter((doc) =>
                    [doc?.name, doc?.fileName, doc?.filename]
                      .filter(Boolean)
                      .some((value) => {
                        const plainValue = String(value).toLowerCase();
                        const compactValue = plainValue.replace(/[^a-z0-9]/gi, '');
                        return plainValue.includes(normalizedQuery) || compactValue.includes(compactQuery);
                      })
                  )
                  .map((doc, index) => ({
                    id: `${caseItem._id}-${index}`,
                    caseId: caseItem._id,
                    caseTitle: caseItem.title,
                    name: doc.name || doc.fileName || doc.filename || 'Document',
                    priority: doc.priority || 'low'
                  }))
              )
              .slice(0, 8)
          : [];

        setResults({
          cases: caseResults,
          documents: documentResults
        });
        setIsOpen(true);
      } catch (error) {
        console.error(error);
        setResults({ cases: [], documents: [] });
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const hasResults = (results.cases?.length || 0) > 0 || (results.documents?.length || 0) > 0;

  return (
    <div ref={wrapRef} className={`app-search-wrap ${className}`}>
      <form
        className="app-search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          if (!query.trim()) return;
          setIsOpen(false);
          navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        {isLoading ? <FaSpinner className="spin-icon" /> : <FaSearch />}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={placeholder}
        />
      </form>

      {isOpen && (
        <div className="app-search-dropdown">
          {hasResults ? (
            <>
              {results.cases.length > 0 && (
                <div className="app-search-group">
                  <p className="app-search-heading">Cases</p>
                  {results.cases.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className="app-search-item"
                      onMouseDown={() => {
                        setIsOpen(false);
                        navigate(`/case/${item._id}`);
                      }}
                    >
                      <div className="app-search-item-main">
                        <strong>{item.title}</strong>
                        <small>{item.description || item.status || 'Case match'}</small>
                      </div>
                      <span>#{item.caseNumber}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.documents.length > 0 && (
                <div className="app-search-group">
                  <p className="app-search-heading">Documents</p>
                  {results.documents.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="app-search-item"
                      onMouseDown={() => {
                        setIsOpen(false);
                        navigate(`/case/${item.caseId}`);
                      }}
                    >
                      <div className="app-search-item-main">
                        <strong>{item.name}</strong>
                        <small>{item.caseTitle}</small>
                      </div>
                      <span className={`priority-pill priority-${item.priority || 'low'}`}>{item.priority || 'low'}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="app-search-empty">No search results</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
