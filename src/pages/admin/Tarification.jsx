import {
  Table,
  Button,
  Popconfirm,
  Space,
  Tag,
  Input,
  Card,
  Empty,
  Modal,
  Form,
  Select,
  message,
  Descriptions,
  Row,
  Col,
  Statistic,
} from "antd";

import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";

import { useContext, useEffect, useState } from "react";
import { TarificationContext } from "../../context/TarificationContext";
import { DestinationContext } from "../../context/DestinationContext";

const { Option } = Select;

const Tarification = () => {
  const {
    tarifications,
    fetchTarifications,
    ajouterTarification,
    modifierTarification,
    supprimerTarification,
  } = useContext(TarificationContext);

  const { destinations } = useContext(DestinationContext);

  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTarifications();
  }, [fetchTarifications]);

  // 🔎 Recherche
  const filteredTarifications = tarifications.filter(
    (t) =>
      (t.code_tarif || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (t.type_service || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (t.destination_nom || "").toLowerCase().includes(searchText.toLowerCase())
  );

  // 🎨 Couleur service
  const getServiceColor = (service) => {
    switch (service) {
      case "STANDARD": return "blue";
      case "EXPRESS": return "orange";
      case "INTERNATIONAL": return "red";
      default: return "default";
    }
  };

  // 📊 Statistiques
  const stats = {
    total: tarifications.length,
    standard: tarifications.filter(t => t.type_service === "STANDARD").length,
    express: tarifications.filter(t => t.type_service === "EXPRESS").length,
    international: tarifications.filter(t => t.type_service === "INTERNATIONAL").length,
  };

  // 📋 Colonnes table
  const columns = [
    { title: "Code", dataIndex: "code_tarif", width: 140, fixed: "left" },
    {
      title: "Service",
      dataIndex: "type_service",
      render: (s) => <Tag color={getServiceColor(s)}>{s}</Tag>,
    },
    { title: "Destination", dataIndex: "destination_nom" },
    { title: "Base", dataIndex: "tarif_base_destination" },
    { title: "Poids", dataIndex: "tarif_poids" },
    { title: "Volume", dataIndex: "tarif_volume" },
    {
      title: "Actions",
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTarif(record);
              setDetailsVisible(true);
            }}
          >
            Détails
          </Button>

          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setIsEditing(true);
              setSelectedTarif(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Modifier
          </Button>

          <Popconfirm
            title="Supprimer cette tarification ?"
            onConfirm={() => supprimerTarification(record.code_tarif)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ➕ Ajouter
  const handleAjouter = () => {
    setIsEditing(false);
    setSelectedTarif(null);
    form.resetFields();
    setModalVisible(true);
  };

  return (
    <div style={{ width: "84vw" }}>
      <Card title="Gestion des Tarifications">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>

          {/* 📊 Stats */}
          <Row gutter={16} style={{ justifyContent: "center", gap: 16 }}>
            <Col span={5}><Card><Statistic title="Total" value={stats.total} /></Card></Col>
            <Col span={5}><Card><Statistic title="Standard" value={stats.standard} valueStyle={{ color: "#1890ff" }} /></Card></Col>
            <Col span={5}><Card><Statistic title="Express" value={stats.express} valueStyle={{ color: "#ea580c" }} /></Card></Col>
            <Col span={5}><Card><Statistic title="International" value={stats.international} valueStyle={{ color: "#CF1322" }} /></Card></Col>
          </Row>

          {/* 🔎 Recherche + Ajouter */}
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Rechercher tarification"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 400 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAjouter}>
              Ajouter Tarification
            </Button>
          </Space>

          {/* 📋 Table */}
          <Table
            columns={columns}
            dataSource={filteredTarifications}
            rowKey="code_tarif"
            bordered
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty /> }}
          />
        </Space>
      </Card>

      {/* ➕ / ✏️ Modal */}
      <Modal
        open={modalVisible}
        title={isEditing ? "Modifier Tarification" : "Ajouter Tarification"}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            try {
              if (isEditing)
                await modifierTarification(selectedTarif.code_tarif, values);
              else
                await ajouterTarification(values);
            } catch {
              message.error("Erreur lors de l'envoi");
            }
            setModalVisible(false);
            form.resetFields();
          }}
        >
          <Form.Item
            name="type_service"
            label="Service"
            rules={[{ required: true, message: "Veuillez sélectionner un service" }]}
          >
            <Select>
              <Option value="STANDARD">Standard</Option>
              <Option value="EXPRESS">Express</Option>
              <Option value="INTERNATIONAL">International</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="destination"
            label="Destination"
            rules={[{ required: true, message: "Veuillez sélectionner une destination" }]}
          >
            <Select>
              {destinations.map(d => (
                <Option key={d.code_d} value={d.code_d}>{d.ville}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="tarif_base_destination"
            label="Tarif Base"
            rules={[{ required: true, message: "Veuillez entrer le tarif de base" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="tarif_poids"
            label="Tarif Poids"
            rules={[{ required: true, message: "Veuillez entrer le tarif par poids" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="tarif_volume"
            label="Tarif Volume"
            rules={[{ required: true, message: "Veuillez entrer le tarif par volume" }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 👁️ Détails */}
      <Modal
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={<Button onClick={() => setDetailsVisible(false)}>Fermer</Button>}
        title="Détails Tarification"
      >
        {selectedTarif && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Code">{selectedTarif.code_tarif}</Descriptions.Item>
            <Descriptions.Item label="Service">{selectedTarif.type_service}</Descriptions.Item>
            <Descriptions.Item label="Destination">{selectedTarif.destination_nom}</Descriptions.Item>
            <Descriptions.Item label="Tarif Base">{selectedTarif.tarif_base_destination}</Descriptions.Item>
            <Descriptions.Item label="Tarif Poids">{selectedTarif.tarif_poids}</Descriptions.Item>
            <Descriptions.Item label="Tarif Volume">{selectedTarif.tarif_volume}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Tarification;
