"use client"

import { createContext, useState, useCallback } from "react"
import { api } from "../services/api"
import axios from "axios"

export const ReclamationContext = createContext()

export const ReclamationProvider = ({ children }) => {
  const [reclamations, setReclamations] = useState([])
  const [clients, setClients] = useState([])
  const [statistiques, setStatistiques] = useState({
    total: 0,
    nouvelles: 0,
    enCours: 0,
    resolues: 0,
  })

  const fetchReclamations = useCallback(async () => {
    try {
      const data = await api.reclamations.getAll()
      const recs = data.results || data
      setReclamations(recs)
      recalculerStats(recs)
    } catch (err) {
      console.error("Erreur fetch réclamations", err)
      setReclamations([])
    }
  }, [])

  const fetchClients = async () => {
    try {
      const res = await axios.get("/api/clients/")
      setClients(res.data.results || [])
    } catch (err) {
      console.error("Erreur fetch clients", err)
      setClients([])
    }
  }

  const ajouterReclamation = async (values) => {
    try {
      const payload = {
        Nature: values.Nature,
        description: values.description,
        CodeClient: values.CodeClient,
        Etat: "Nouvelle",
      }

      await api.reclamations.create(payload)
      fetchReclamations()
    } catch (err) {
      console.error("Erreur ajout réclamation", err.response?.data || err)
    }
  }

  const changerStatutReclamation = async (id, etat) => {
    try {
      await api.reclamations.update(id, { Etat: etat })
      fetchReclamations()
    } catch (err) {
      console.error("Erreur changement statut", err)
    }
  }

  const recalculerStats = (data) => {
    setStatistiques({
      total: data.length,
      nouvelles: data.filter((r) => r.Etat === "Nouvelle").length,
      enCours: data.filter((r) => r.Etat === "En cours").length,
      resolues: data.filter((r) => r.Etat === "Résolue").length,
    })
  }

  return (
    <ReclamationContext.Provider
      value={{
        reclamations,
        clients,
        statistiques,
        fetchReclamations,
        fetchClients,
        ajouterReclamation,
        changerStatutReclamation,
      }}
    >
      {children}
    </ReclamationContext.Provider>
  )
}
