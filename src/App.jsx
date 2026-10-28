import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [model, setModel] = useState('100')
  const [formData, setFormData] = useState({
    carat: 1.1, cut: 'Ideal', color: 'H', clarity: 'SI2',
    depth: 62, table: 55, x: 6.61, y: 6.65, z: 4.11
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [retraining, setRetraining] = useState(false)
  const [retrainStatus, setRetrainStatus] = useState('')

  // 1. URLs de tus APIs en Render (Predicciones)
  const API_URLS = {
    '100': 'https://diamonds-api-100.onrender.com/score',
    '50': ' https://diamonds-api-50.onrender.com/score',
    '25': 'https://diamonds-api-25.onrender.com/score'
  }

  // 2. URLs de tus Datasets en Cloudinary (Para reentrenar)
  const DATASET_URLS = {
    '100': 'https://res.cloudinary.com/dgsjf1njc/raw/upload/v1792591972/diamonds_100_kaidbm.csv',
    '50': 'https://res.cloudinary.com/dgsjf1njc/raw/upload/v1792592033/diamonds_50_wmq4cv.csv',
    '25': 'https://res.cloudinary.com/dgsjf1njc/raw/upload/v1792592045/diamonds_25_ngzh2w.csv'
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Función para predecir el precio
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        carat: parseFloat(formData.carat),
        depth: parseFloat(formData.depth),
        table: parseFloat(formData.table),
        x: parseFloat(formData.x),
        y: parseFloat(formData.y),
        z: parseFloat(formData.z)
      }
      
      const response = await axios.post(API_URLS[model], payload)
      setResult(response.data.score)
    } catch (error) {
      console.error("Error al calcular:", error)
      setResult("Error en la conexión con la API")
    }
    setLoading(false)
  }

  // Función para disparar el reentrenamiento en GitHub Actions
  const handleRetrain = async () => {
    setRetraining(true)
    setRetrainStatus('Enviando orden a GitHub...')
    
    // TOKEN DE GITHUB
    const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN; 

    try {
      await axios.post(
        'https://api.github.com/repos/valux0/heart-model/dispatches',
        {
          event_type: 'ml_ci_cd',
          client_payload: {
            dataseturl: DATASET_URLS[model],
            sha: `diamonds-${model}`
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          }
        }
      )
      setRetrainStatus(`¡Reentrenamiento del ${model}% iniciado en GitHub Actions!`)
    } catch (error) {
      console.error("Error al reentrenar:", error)
      setRetrainStatus('Error al iniciar el reentrenamiento.')
    }
    setRetraining(false)
  }

  return (
    <div className="container">
      <div className="card">
        <h2>💎 Predicción de Precios de Diamantes</h2>
        <p className="subtitle">Selecciona el modelo entrenado y calcula el precio estimado.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group full-width">
            <label>Dataset / Modelo a consultar:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ flex: 1 }} value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="100">Modelo Entrenado al 100% Dataset</option>
                <option value="50">Modelo Entrenado al 50% Dataset</option>
                <option value="25">Modelo Entrenado al 25% Dataset</option>
              </select>
              
              <button type="button" onClick={handleRetrain} disabled={retraining} className="btn-retrain">
                {retraining ? 'Disparando...' : 'Reentrenar Modelo'}
              </button>
            </div>
            
            {/* Mensaje de estado del reentrenamiento */}
            {retrainStatus && <p className="status-msg">{retrainStatus}</p>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Carat (Quilates):</label>
              <input type="number" step="0.01" name="carat" value={formData.carat} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Cut (Corte):</label>
              <select name="cut" value={formData.cut} onChange={handleChange}>
                <option value="Ideal">Ideal</option>
                <option value="Premium">Premium</option>
                <option value="Very Good">Very Good</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Color:</label>
              <select name="color" value={formData.color} onChange={handleChange}>
                <option value="D">D (Mejor)</option><option value="E">E</option>
                <option value="F">F</option><option value="G">G</option>
                <option value="H">H</option><option value="I">I</option>
                <option value="J">J (Peor)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Clarity (Claridad):</label>
              <select name="clarity" value={formData.clarity} onChange={handleChange}>
                <option value="IF">IF</option><option value="VVS1">VVS1</option>
                <option value="VVS2">VVS2</option><option value="VS1">VS1</option>
                <option value="VS2">VS2</option><option value="SI1">SI1</option>
                <option value="SI2">SI2</option><option value="I1">I1</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Calculando...' : 'Calcular Predicción'}
          </button>
        </form>

        {result && (
          <div className="result-box">
            <p>Precio Estimado (Modelo {model}%):</p>
            <h3>{typeof result === 'number' ? `$${result.toFixed(2)}` : result}</h3>
          </div>
        )}
      </div>
    </div>
  )
}

export default App