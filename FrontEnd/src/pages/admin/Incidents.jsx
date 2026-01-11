"use client"

import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Card,
  Empty,
  Modal,
  Form,
  Descriptions,
  Row,
  Col,
  Statistic,
  Select,
  Spin,
} from "antd"
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import { useContext, useEffect, useState } from "react"
import { IncidentContext } from "../../context/incidentContext"
import dayjs from "dayjs"

const { TextArea } = Input

const Incidents = () => {
  const {
    incidents,
    expeditions,
    fetchIncidents,
    fetchExpeditions,
    addIncident,
    changerEtatIncident,
    resoudreIncident, // ← Ajoutez ceci
    loading,
  } = useContext(IncidentContext)

  const [searchText, setSearchText] = useState("")
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [ajouterVisible, setAjouterVisible] = useState(false)
  const [resolutionVisible, setResolutionVisible] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [form] = Form.useForm()
  const [resolutionForm] = Form.useForm()

  useEffect(() => {
    fetchIncidents()
    fetchExpeditions()
  }, [])

  // Filtrage des incidents
  const filteredIncidents = incidents.filter(inc => {
    const searchLower = searchText.toLowerCase()
    return (
      inc.code_inc?.toString().includes(searchText) ||
      inc.type_display?.toLowerCase().includes(searchLower) ||
      inc.type?.toLowerCase().includes(searchLower) ||
      inc.numexp?.toString().includes(searchText) ||
      inc.expedition?.toLowerCase().includes(searchLower) ||
      inc.commentaire?.toLowerCase().includes(searchLower)
    )
  })

  // Couleurs des états
  const getEtatColor = (etat) => {
    switch (etat) {
      case "NOUVEAU": return "blue"
      case "EN_COURS": return "orange"
      case "RESOLU": return "green"
      case "FERME": return "default"
      default: return "default"
    }
  }

  // Colonnes du tableau
  const columns = [
    {
      title: "Code",
      dataIndex: "code_inc",
      width: 120,
      sorter: (a, b) => a.code_inc - b.code_inc,
    },
    {
      title: "Type",
      dataIndex: "type_display",
      render: (text, record) => text || record.type,
    },
    {
      title: "Expédition",
      dataIndex: "expedition",
      render: (text, record) => text || `#${record.numexp}`,
    },
    {
    title: "Wilaya",
    dataIndex: "wilaya",
    key: "wilaya",
  },
  {
    title: "Commune",
    dataIndex: "commune",
    key: "commune",
  },
    {
      title: "Commentaire",
      dataIndex: "commentaire",
      ellipsis: true,
      render: (text) => text || <span style={{ color: "#ccc" }}>Aucun commentaire</span>,
    },
    {
      title: "État",
      dataIndex: "etat",
      render: (etat, record) => (
        <Tag color={getEtatColor(etat)}>
          {record.etat_display || etat}
        </Tag>
      ),
    },
    {
      title: "Date création",
      dataIndex: "date_creation",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "-",
      sorter: (a, b) => new Date(a.date_creation) - new Date(b.date_creation),
    },
    {
      title: "Actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedIncident(record)
              setDetailsVisible(true)
            }}
          />
          {record.etat === "NOUVEAU" && (
            <Button
              icon={<SyncOutlined />}
              size="small"
              type="default"
              onClick={() => changerEtatIncident(record.code_inc, "EN_COURS")}
            />
          )}
          {record.etat !== "RESOLU" && record.etat !== "FERME" && (
            <Button
              icon={<CheckCircleOutlined />}
              size="small"
              type="primary"
              onClick={() => handleResoudre(record)}
            />
          )}
        </Space>
      ),
    },
  ]

  // Soumission du formulaire d'ajout
  const handleAjouterSubmit = async (values) => {
    try {
      await addIncident(values)
      setAjouterVisible(false)
      form.resetFields()
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error)
    }
  }

  // Gérer la résolution d'un incident
  const handleResoudre = (incident) => {
    setSelectedIncident(incident)
    setResolutionVisible(true)
  }

  const handleResolutionSubmit = async (values) => {
    try {
      await resoudreIncident(selectedIncident.code_inc, values.resolution)
      setResolutionVisible(false)
      resolutionForm.resetFields()
    } catch (error) {
      console.error("Erreur lors de la résolution:", error)
    }
  }

  return (
    <div style={{ width: "84vw", padding: "20px" }}>
      <Card title="Gestion des Incidents">
        {/* Statistiques */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Statistic title="Total" value={incidents.length} />
          </Col>
          <Col span={6}>
            <Statistic
              title="Nouveaux"
              value={incidents.filter(i => i.etat === "NOUVEAU").length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="En cours"
              value={incidents.filter(i => i.etat === "EN_COURS").length}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Résolus"
              value={incidents.filter(i => i.etat === "RESOLU").length}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
        </Row>

        {/* Barre de recherche et bouton d'ajout */}
        <Space style={{ marginBottom: 20 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Rechercher un incident..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAjouterVisible(true)}
          >
            Nouvel incident
          </Button>
        </Space>

        {/* Tableau des incidents */}
        <Table
          columns={columns}
          dataSource={filteredIncidents}
          rowKey="code_inc"
          loading={loading}
          locale={{ emptyText: <Empty description="Aucun incident trouvé" /> }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} incidents`,
          }}
        />
      </Card>

      {/* Modal détails */}
      <Modal
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        title="Détails de l'incident"
        width={600}
      >
        {selectedIncident && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Code">
              {selectedIncident.code_inc}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {selectedIncident.type_display || selectedIncident.type}
            </Descriptions.Item>
            <Descriptions.Item label="Expédition">
              {selectedIncident.expedition || `#${selectedIncident.numexp}`}
            </Descriptions.Item>
            <Descriptions.Item label="Commentaire">
              {selectedIncident.commentaire || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="État">
              <Tag color={getEtatColor(selectedIncident.etat)}>
                {selectedIncident.etat_display || selectedIncident.etat}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date création">
              {selectedIncident.date_creation
                ? dayjs(selectedIncident.date_creation).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
            {selectedIncident.resolution && (
              <Descriptions.Item label="Résolution">
                {selectedIncident.resolution}
              </Descriptions.Item>
            )}
            {selectedIncident.date_resolution && (
              <Descriptions.Item label="Date résolution">
                {dayjs(selectedIncident.date_resolution).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Modal ajout */}
      <Modal
        open={ajouterVisible}
        onCancel={() => {
          setAjouterVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        title="Créer un nouvel incident"
        okText="Créer"
        cancelText="Annuler"
      >
        <Form layout="vertical" form={form} onFinish={handleAjouterSubmit}>
          <Form.Item
            label="Type d'incident"
            name="type"
            rules={[{ required: true, message: "Le type est requis" }]}
          >
            <Select placeholder="Sélectionner un type">
              <Select.Option value="RETARD">Retard</Select.Option>
              <Select.Option value="PERTE">Perte</Select.Option>
              <Select.Option value="ENDOMMAGEMENT">Endommagement</Select.Option>
              <Select.Option value="AUTRE">Autre</Select.Option>
            </Select>
          </Form.Item>
            <Form.Item
    name="wilaya"
    label="Wilaya"
    rules={[{ required: true, message: "Veuillez saisir la wilaya" }]}
  >
    <Input placeholder="Ex: Alger" />
  </Form.Item> 
    <Form.Item
    name="commune"
    label="Commune"
    rules={[{ required: true, message: "Veuillez saisir la commune" }]}
  >
    <Input placeholder="Ex: Bab Ezzouar" />
  </Form.Item>
          <Form.Item
            label="Commentaire"
            name="commentaire"
            rules={[
              { required: true, message: "Le commentaire est requis" },
              { min: 10, message: "Minimum 10 caractères" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Décrivez l'incident en détail..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Expédition concernée"
            name="numexp"
            rules={[{ required: true, message: "L'expédition est requise" }]}
          >
            <Select
              placeholder="Choisir une expédition"
              showSearch
              optionFilterProp="label"
              loading={expeditions.length === 0}
              notFoundContent={
                expeditions.length === 0 ? (
                  <Empty description="Aucune expédition disponible" />
                ) : null
              }
            >
              {expeditions.map((exp) => (
                <Select.Option
                  key={exp.numexp}
                  value={exp.numexp}
                  label={`#${exp.numexp} - ${exp.client_nom || "Client"}`}
                >
                  <div>
                    <strong>#{exp.numexp}</strong>
                    {exp.client_nom && ` - ${exp.client_nom}`}
                    <br />
                    <small>
                      Poids: {exp.poids}kg | Volume: {exp.volume}m³
                    </small>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal résolution */}
      <Modal
        open={resolutionVisible}
        onCancel={() => {
          setResolutionVisible(false)
          resolutionForm.resetFields()
        }}
        onOk={() => resolutionForm.submit()}
        title="Résoudre l'incident"
        okText="Résoudre"
        cancelText="Annuler"
      >
        {selectedIncident && (
          <>
            <p style={{ marginBottom: 16 }}>
              <strong>Incident #{selectedIncident.code_inc}</strong> - {selectedIncident.type_display}
            </p>
            <Form layout="vertical" form={resolutionForm} onFinish={handleResolutionSubmit}>
              <Form.Item
                label="Description de la résolution"
                name="resolution"
                rules={[
                  { required: true, message: "La résolution est requise" },
                  { min: 20, message: "Minimum 20 caractères" },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Décrivez comment l'incident a été résolu..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}

export default Incidents