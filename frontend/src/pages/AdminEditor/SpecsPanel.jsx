import { useEffect, useState } from "react";
import { api } from "../../api/client";
import UploadImages from "../../components/UploadImages/UploadImages.jsx";

export default function SpecsPanel({ tshirtId }) {
  const [specs, setSpecs] = useState([]);
  const [current, setCurrent] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data } = await api.get(`/admin/tshirts/${tshirtId}/specs`);
    setSpecs(data.specs);
    setCurrent(data.specs[0] || null); // latest first (route orders desc)
  }
  useEffect(() => { if (tshirtId) load(); }, [tshirtId]);

  async function createDraft() {
    const { data } = await api.post(`/admin/tshirts/${tshirtId}/specs`);
    setCurrent(data);
    load();
  }

  async function saveArtwork(patch) {
    await api.patch(`/admin/specs/${current.id}`, patch);
    load();
  }

  async function saveVariants(text) {
    // expect CSV-ish lines: size,color,productUid
    const rows = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const payload = rows.map(r => {
      const [size, color, productUid] = r.split(",").map(s => s.trim());
      return { size, color, productUid };
    });
    await api.put(`/admin/specs/${current.id}/variants`, payload);
    load();
  }

  async function publish() {
    const { data } = await api.post(`/admin/specs/${current.id}/publish`);
    setMsg(`Published v${data.version}`);
    load();
  }

  if (!tshirtId) return <p>Select or create a product first.</p>;

  return (
    <div style={{display:"grid", gap:12}}>
      <div>
        <strong>Versions:</strong>{" "}
        {specs.map(s => (
          <button key={s.id} onClick={()=>setCurrent(s)} style={{marginRight:6}}>
            v{s.version}{s.isPublished ? " (LIVE)" : ""}
          </button>
        ))}
        <button onClick={createDraft} style={{marginLeft:8}}>+ New Draft</button>
      </div>

      {current && (
        <>
          <div style={{display:"grid", gap:8, gridTemplateColumns:"1fr 1fr"}}>
            <div>
              <div><strong>Front artwork</strong></div>
              <UploadImages onUploaded={urls => saveArtwork({ frontFileUrl: urls[0] })} />
              {current.frontFileUrl && <img src={current.frontFileUrl} alt="" style={{maxWidth:"100%", borderRadius:8}} />}
            </div>
            <div>
              <div><strong>Back artwork</strong></div>
              <UploadImages onUploaded={urls => saveArtwork({ backFileUrl: urls[0] })} />
              {current.backFileUrl && <img src={current.backFileUrl} alt="" style={{maxWidth:"100%", borderRadius:8}} />}
            </div>
          </div>

          <div>
            <strong>Colors for this version</strong>
            <input
              style={{display:"block", width:"100%"}}
              defaultValue={(current.colors || []).join(",")}
              onBlur={(e) => saveArtwork({ colors: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })}
              placeholder="Black,White,Navy"
            />
          </div>

          <div>
            <strong>Variants (size,color,productUid per line)</strong>
            <textarea
              rows={5}
              placeholder="M,Black,apparel_product_..."
              defaultValue={(current.variants || []).map(v=>`${v.size},${v.color},${v.productUid}`).join("\n")}
              onBlur={(e)=>saveVariants(e.target.value)}
              style={{width:"100%"}}
            />
          </div>

          <div>
            <button onClick={publish} disabled={current.isPublished}>Publish this version</button>
            {msg && <span style={{marginLeft:8}}>{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
