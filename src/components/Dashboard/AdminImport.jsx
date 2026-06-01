import { useState, useRef } from "react";
import "./AdminImport.css";
import { useCurrency } from "../Currency/CurrencyContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const KNOWN_COLUMNS = [
  "name",
  "title",
  "product name",
  "sale price",
  "price",
  "category",
  "description",
  "barcode",
  "brand name",
  "brand",
  "supplier name",
  "supplier",
  "cost price",
  "old price",
  "wholesale price",
  "max discount",
  "single discount",
  "quantity",
  "stock",
  "warranty",
  "stock date",
  "stockdate",
  "expire date",
  "expiredate",
  "stars",
  "reviews",
  "featured",
  "bg",
  "background",
  "tag",
  "tag label",
  "taglabel",
];

export default function AdminImport() {
  const { currencies } = useCurrency();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [importCurrency, setImportCurrency] = useState("LKR");
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setError("Only .xlsx, .xls, or .csv files are supported");
      return;
    }
    setError("");
    setResult(null);
    setPreview(null);
    setFile(f);
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("bb_token");
      const form = new FormData();
      form.append("file", file);
      form.append("currency", importCurrency);
      const res = await fetch(`${API_BASE}/api/import/preview`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPreview(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("bb_token");
      const form = new FormData();
      form.append("file", file);
      form.append("currency", importCurrency);
      const res = await fetch(`${API_BASE}/api/import/products`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data);
      setFile(null);
      setPreview(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const token = localStorage.getItem("bb_token");
    fetch(`${API_BASE}/api/import/template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "buybee-products-template.xlsx";
        a.click();
      });
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="ai-root">
      {/* Header */}
      <div className="ai-header">
        <div>
          <h1 className="ai-header__title">📥 Import Products</h1>
          <p className="ai-header__sub">
            Upload an Excel or CSV file to bulk-add products
          </p>
        </div>
        <button className="ai-btn ai-btn--ghost" onClick={downloadTemplate}>
          ⬇️ Download Template
        </button>
      </div>

      {/* Currency selector */}
      <div className="ai-currency-bar">
        <span className="ai-currency-bar__label">
          💱 Prices in my Excel are in:
        </span>
        <select
          className="ai-currency-bar__select"
          value={importCurrency}
          onChange={(e) => setImportCurrency(e.target.value)}
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name} ({c.symbol})
            </option>
          ))}
        </select>
        {importCurrency !== "USD" ? (
          <span className="ai-currency-bar__hint">
            → will be converted to USD for storage
          </span>
        ) : (
          <span className="ai-currency-bar__hint ai-currency-bar__hint--ok">
            ✓ no conversion needed
          </span>
        )}
      </div>

      {/* Instructions */}
      <div className="ai-instructions">
        <div className="ai-instructions__title">How it works</div>
        <div className="ai-instructions__steps">
          <div className="ai-step">
            <span className="ai-step__num">1</span>
            <span>Select the currency your Excel prices are in above</span>
          </div>
          <div className="ai-step">
            <span className="ai-step__num">2</span>
            <span>
              Required columns: <code>name</code>, <code>sale price</code>.
              Everything else is optional
            </span>
          </div>
          <div className="ai-step">
            <span className="ai-step__num">3</span>
            <span>
              Click <strong>Preview Columns</strong> first to verify your file
              is read correctly
            </span>
          </div>
          <div className="ai-step">
            <span className="ai-step__num">4</span>
            <span>
              If a product with the same <code>barcode</code> exists, it will be{" "}
              <strong>updated</strong> not duplicated
            </span>
          </div>
        </div>
      </div>

      {/* Dropzone — only show before preview/result */}
      {!preview && !result && (
        <>
          <div
            className={`ai-dropzone ${dragging ? "ai-dropzone--drag" : ""} ${file ? "ai-dropzone--has-file" : ""}`}
            onClick={() => !file && inputRef.current.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            {file ? (
              <div className="ai-file-selected">
                <div className="ai-file-selected__icon">📊</div>
                <div className="ai-file-selected__name">{file.name}</div>
                <div className="ai-file-selected__size">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
                <button
                  className="ai-btn ai-btn--ghost ai-btn--sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <>
                <div className="ai-dropzone__icon">📂</div>
                <div className="ai-dropzone__text">
                  Click or drag your Excel / CSV file here
                </div>
                <div className="ai-dropzone__hint">
                  .xlsx · .xls · .csv · max 10 MB
                </div>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {file && (
            <button
              className="ai-btn ai-btn--primary ai-btn--import"
              onClick={handlePreview}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ai-spinner" /> Reading file…
                </>
              ) : (
                "🔍 Preview Columns"
              )}
            </button>
          )}
        </>
      )}

      {error && <div className="ai-error">⚠️ {error}</div>}

      {/* Preview step */}
      {preview && !result && (
        <div className="ai-preview">
          <div className="ai-preview__header">
            <div>
              <div className="ai-preview__title">
                📋 {preview.totalRows} rows detected in file
              </div>
              <div className="ai-preview__sub">
                Verify your column names are recognized before importing.
              </div>
            </div>
            <button className="ai-btn ai-btn--ghost ai-btn--sm" onClick={reset}>
              ✕ Change file
            </button>
          </div>

          <div className="ai-preview__cols">
            {preview.normalizedColumns.map((col) => {
              const isKnown = KNOWN_COLUMNS.includes(col);
              return (
                <span
                  key={col}
                  className={`ai-preview__col ${isKnown ? "ai-preview__col--known" : "ai-preview__col--unknown"}`}
                >
                  {col} {isKnown ? "✓" : "?"}
                </span>
              );
            })}
          </div>

          {preview.normalizedColumns.some(
            (c) => !KNOWN_COLUMNS.includes(c),
          ) && (
            <div className="ai-preview__warn">
              ⚠️ Columns marked <strong>?</strong> are not recognized and will
              be ignored.
            </div>
          )}

          {preview.preview.length > 0 && (
            <div className="ai-preview__sample">
              <div className="ai-preview__sample-title">First row sample:</div>
              <div className="ai-preview__sample-grid">
                {Object.entries(preview.preview[0]).map(([k, v]) => (
                  <div key={k} className="ai-preview__sample-row">
                    <span className="ai-preview__sample-key">{k}</span>
                    <span className="ai-preview__sample-val">
                      {String(v) || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ai-preview__actions">
            <button className="ai-btn ai-btn--ghost" onClick={reset}>
              ← Back
            </button>
            <button
              className="ai-btn ai-btn--primary"
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ai-spinner" /> Importing…
                </>
              ) : (
                `📥 Import ${preview.totalRows} rows as ${importCurrency}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="ai-result">
          <div className="ai-result__title">✅ Import Complete</div>
          <div className="ai-result__stats">
            <div className="ai-stat ai-stat--green">
              <div className="ai-stat__num">{result.inserted}</div>
              <div className="ai-stat__label">Inserted</div>
            </div>
            <div className="ai-stat ai-stat--blue">
              <div className="ai-stat__num">{result.updated}</div>
              <div className="ai-stat__label">Updated</div>
            </div>
            <div className="ai-stat ai-stat--orange">
              <div className="ai-stat__num">{result.skipped}</div>
              <div className="ai-stat__label">Skipped</div>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="ai-result__errors">
              <div className="ai-result__errors-title">
                ⚠️ Row errors ({result.errors.length})
              </div>
              {result.errors.slice(0, 20).map((e, i) => (
                <div key={i} className="ai-result__error-row">
                  {e}
                </div>
              ))}
              {result.errors.length > 20 && (
                <div className="ai-result__error-row">
                  …and {result.errors.length - 20} more
                </div>
              )}
            </div>
          )}
          <button
            className="ai-btn ai-btn--ghost"
            style={{ marginTop: 16 }}
            onClick={reset}
          >
            Import another file
          </button>
        </div>
      )}

      {/* Column reference */}
      <div className="ai-columns">
        <div className="ai-columns__title">
          Recognized Column Names (any case)
        </div>
        <div className="ai-columns__grid">
          {[
            ["name / title *", "Product name (required)"],
            [
              "sale price / price *",
              "Price in your selected currency (required)",
            ],
            ["category", "Category"],
            ["description", "Description"],
            ["barcode", "Used for upsert matching"],
            ["brand name / brand", "Brand"],
            ["supplier name", "Supplier"],
            ["cost price", "What you paid"],
            ["old price", "Crossed-out price"],
            ["wholesale price", "Bulk buyer price"],
            ["max discount", "Max discount allowed"],
            ["single discount", "Per-item discount"],
            ["quantity / stock", "Stock quantity"],
            ["warranty", "e.g. 1 Year"],
            ["stock date", "Date received YYYY-MM-DD"],
            ["expire date", "Expiry date YYYY-MM-DD"],
            ["stars", "Rating 0–5"],
            ["reviews", "Review count"],
            ["featured", "yes / no"],
            ["tag", "hot / new / sale"],
            ["tag label", "Custom tag text"],
          ].map(([col, desc]) => (
            <div key={col} className="ai-col-row">
              <code
                className={
                  col.includes("*")
                    ? "ai-col-row__name ai-col-row__name--required"
                    : "ai-col-row__name"
                }
              >
                {col}
              </code>
              <span className="ai-col-row__desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
