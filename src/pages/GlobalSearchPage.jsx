import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { FaFilePdf, FaFolderOpen, FaSearch } from 'react-icons/fa';

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

function GlobalSearchPage() {
  const [currentUser, setCurrentUser] = useState({ name: 'Guest', initials: 'G' });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ cases: [], documents: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const savedName = localStorage.getItem('loggedInUserName');
    if (savedName) {
      const initials = savedName.split(' ').map(n => n[0]).join('').toUpperCase();
      setCurrentUser({ name: savedName, initials: initials });
    }
  }, []);

  useEffect(() => {
    const incomingQuery = searchParams.get('q') || '';
    setQuery(incomingQuery);
  }, [searchParams]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ cases: [], documents: [] });
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const casesResponse = await fetch('http://localhost:5000/api/cases', {
          credentials: 'include'
        });
        const allCases = await casesResponse.json().catch(() => []);

        if (!casesResponse.ok) {
          throw new Error('Unable to fetch cases');
        }

        const normalizedQuery = query.trim().toLowerCase();
        const caseResults = Array.isArray(allCases)
          ? allCases
              .filter((caseItem) => matchesCaseQuery(caseItem, query))
              .slice(0, 20)
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
                        const compactQuery = normalizedQuery.replace(/[^a-z0-9]/gi, '');
                        return plainValue.includes(normalizedQuery) || compactValue.includes(compactQuery);
                      })
                  )
                  .map((doc, index) => ({
                    id: `${caseItem._id}-${index}`,
                    caseId: caseItem._id,
                    caseTitle: caseItem.title,
                    caseNumber: caseItem.caseNumber,
                    name: doc.name || doc.fileName || doc.filename || 'Document',
                    priority: doc.priority || 'low'
                  }))
              )
              .slice(0, 20)
          : [];

        setResults({
          cases: caseResults,
          documents: documentResults
        });
      } catch (error) {
        console.error(error);
        setResults({ cases: [], documents: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const totalResults = (results.cases?.length || 0) + (results.documents?.length || 0);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setSearchParams({ q: trimmedQuery });
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
  };

  return (
    <DashboardLayout userName={currentUser.name} userInitials={currentUser.initials} showSearch={false}>
      <div className="search-page-container">
        <section className="search-hero-card">
          <div className="search-hero-copy">
            <span className="search-hero-kicker">Global Search</span>
            <h1>Find cases and documents instantly</h1>
            <p>Search by case title, case number, status, description, or document name.</p>
          </div>

          <form className="global-search-bar" onSubmit={handleSearch}>
            <div className="global-search-input-wrap">
              <FaSearch className="search-icon-large" />
              <input 
                type="text" 
                placeholder="Search across all cases and documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="search-suggestions">
            <span>Quick picks</span>
            <button type="button" onClick={() => handleSuggestionClick('contract')}>
              Contract
            </button>
            <button type="button" onClick={() => handleSuggestionClick('processing')}>
              Processing
            </button>
            <button type="button" onClick={() => handleSuggestionClick('case')}>
              Case
            </button>
          </div>
        </section>

        <div className="search-results-container">
          {totalResults > 0 && <h3>Found {totalResults} results for "{query}"</h3>}

          <div className="search-results-list">
            {results.cases.map((result) => (
              <div key={result._id} className="result-snippet-card">
                <div className="result-icon">
                  <FaFolderOpen />
                </div>
                <div className="result-content">
                  <Link to={`/case/${result._id}`} className="result-title">
                    <strong>{result.title}</strong>
                  </Link>
                  <span className="result-source">Case #{result.caseNumber}</span>
                  <p className="result-snippet">{result.description || result.status}</p>
                </div>
              </div>
            ))}

            {results.documents.map((result) => (
              <div key={result.id} className="result-snippet-card">
                <div className="result-icon">
                  <FaFilePdf />
                </div>
                <div className="result-content">
                  <Link to={`/case/${result.caseId}`} className="result-title">
                    <strong>{result.name}</strong>
                  </Link>
                  <span className="result-source">{result.caseTitle}</span>
                  <p className="result-snippet">Priority: {result.priority || 'low'}</p>
                </div>
              </div>
            ))}
            
            {isSearching && <p className="loading-text">Searching...</p>}
            
            {!isSearching && totalResults === 0 && query !== '' && (
              <div className="search-empty-state">
                <FaSearch />
                <p>No results found for "{query}".</p>
                <span>Try a case title, case number, status, or document name.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default GlobalSearchPage;
