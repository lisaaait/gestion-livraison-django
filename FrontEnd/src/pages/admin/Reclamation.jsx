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
  message,
  Descriptions,
  Row,
  Col,
  Statistic,
  Select,
} from "antd"
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import { useContext, useEffect, useState } from "react"
import { ReclamationContext } from "../../context/ReclamationContext"
import dayjs from "dayjs"

const { TextArea } = Input

const Reclamations = () => {
  const {
    reclamations,
    statistiques,
    clients,
    fetchClients,
    fetchReclamations,
    ajouterReclamation,
    changerStatutReclamation,
  } = useContext(ReclamationContext)

  const [searchText, setSearchText] = useState("")
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [ajouterVisible, setAjouterVisible] = useState(false)
  const [selectedReclamation, setSelectedReclamation] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchReclamations()
    fetchClients()
  }, [fetchReclamations, fetchClients])

  const filteredReclamations = Array.isArray(reclamations)
    ? reclamations.filter(
        (rec) =>
          rec.CodeREC?.toString().includes(searchText) ||
          rec.CodeClient_id?.toString().includes(searchText) ||
          rec.Nature?.toLowerCase().includes(searchText.toLowerCase())
      )
    : []

  const getStatutColor = (etat) => {
    switch (etat) {
      case "Nouvelle":
        return "blue"
      case "En cours":
        return "orange"
      case "Résolue":
        return "green"
      default:
        return "default"
    }
  }

  const columns = [
    {
      title: "N°",
      dataIndex: "CodeREC",
      key: "CodeREC",
      width: 100,
    },
    {
      title: "Date",
      dataIndex: "Date",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Client ID",
      dataIndex: "CodeClient",
       render: (_, record) =>
    `${record.client_nom} ${record.client_prenom}`,
    },
    {
      title: "Nature",
      dataIndex: "Nature",
    },
    {
      title: "Statut",
      dataIndex: "Etat",
      render: (etat) => <Tag color={getStatutColor(etat)}>{etat}</Tag>,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedReclamation(record)
              setDetailsVisible(true)
            }}
          />

          {record.Etat === "Nouvelle" && (
            <Button
              icon={<SyncOutlined />}
              onClick={() =>
                changerStatutReclamation(record.CodeREC, "En cours")
              }
            />
          )}

          {record.Etat !== "Résolue" && (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() =>
                changerStatutReclamation(record.CodeREC, "Résolue")
              }
            />
          )}
        </Space>
      ),
    },
  ]

  const handleAjouterSubmit = async (values) => {
    await ajouterReclamation(values)
    message.success("Réclamation ajoutée")
    setAjouterVisible(false)
    form.resetFields()
  }

  return (
    <div style={{ width: "84vw" }}>
      <Card title="Gestion des Réclamations">
        <Row gutter={16}>
          <Col span={6}><Statistic title="Total" value={statistiques.total} /></Col>
          <Col span={6}><Statistic title="Nouvelles" value={statistiques.nouvelles} /></Col>
          <Col span={6}><Statistic title="En cours" value={statistiques.enCours} /></Col>
          <Col span={6}><Statistic title="Résolues" value={statistiques.resolues} /></Col>
        </Row>

        <Space style={{ margin: "20px 0" }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Rechercher"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAjouterVisible(true)}
          >
            Nouvelle réclamation
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredReclamations}
          rowKey="CodeREC"
          locale={{ emptyText: <Empty /> }}
        />
      </Card>

      {/* Détails */}
      <Modal
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        title="Détails réclamation"
      >
        {selectedReclamation && (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Client">
              {selectedReclamation.client_nom} {selectedReclamation.client_prenom}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color={getStatutColor(selectedReclamation.Etat)}>
                {selectedReclamation.Etat}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nature" span={2}>
              {selectedReclamation.Nature}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {dayjs(selectedReclamation.Date).format("YYYY-MM-DD")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Ajouter */}
      <Modal
        open={ajouterVisible}
        onCancel={() => setAjouterVisible(false)}
        onOk={() => form.submit()}
        title="Nouvelle réclamation"
      >
        <Form layout="vertical" form={form} onFinish={handleAjouterSubmit}>
          <Form.Item
            name="CodeClient"
            label="Client"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              placeholder="Sélectionner un client"
              options={clients.map((c) => ({
                value: c.CodeClient,
                label: `${c.Nom} ${c.Prenom}`,
              }))}
            />
          </Form.Item>

          <Form.Item name="Nature" label="Nature" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Reclamations
