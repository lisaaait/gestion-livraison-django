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
import { DestinationContext } from "../../context/DestinationContext.jsx";

const { Option } = Select;

const zoneMap = {
  Nord: "NORD",
  Sud: "SUD",
  Est: "EST",
  Ouest: "OUEST",
  International: "INTERNATIONAL",
  Centre: "CENTRE",
};

const Destination = () => {
  const {
    destinations,
    statistiques,
    fetchDestinations,
    ajouterDestination,
    modifierDestination,
    supprimerDestination,
  } = useContext(DestinationContext);

  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const filteredDestinations = destinations.filter(
    (d) =>
      (d.code_d || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (d.ville || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (d.pays || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (d.zone_geo || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const getZoneColor = (zone) => {
    switch (zone) {
      case "NORD": return "blue";
      case "SUD": return "orange";
      case "EST": return "green";
      case "OUEST": return "purple";
      case "INTERNATIONAL": return "red";
      case "CENTRE": return "cyan";
      default: return "default";
    }
  };

  const columns = [
    { title: "Code", dataIndex: "code_d", key: "code_d", width: 150, fixed: "left" },
    { title: "Ville", dataIndex: "ville", width: 180 },
    { title: "Pays", dataIndex: "pays", width: 180 },
    { title: "Zone géographique", dataIndex: "zone_geo", width: 180, render: (z) => <Tag color={getZoneColor(z)}>{z}</Tag> },
    {
      title: "Actions",
      width: 240,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelectedDestination(record); setDetailsVisible(true); }}>
            Détails
          </Button>
          <Popconfirm title="Supprimer cette destination ?" onConfirm={() => supprimerDestination(record.code_d)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAjouter = () => {
    setIsEditing(false);
    setSelectedDestination(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModifier = (destination) => {
    setIsEditing(true);
    setSelectedDestination(destination);
    form.setFieldsValue({ ...destination, zoneGeo: destination.zone_geo });
    setModalVisible(true);
  };

  return (
    <div style={{ width: "84vw" }}>
      <Card title="Gestion des Destinations">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={16} style={{ justifyContent: "center" , gap: 16}}>
            <Col span={5}><Card><Statistic title="Total" value={statistiques.total} /></Card></Col>
            <Col span={5}><Card><Statistic title="Nord" value={statistiques.nord} valueStyle={{ color: "#1890ff" }} /></Card></Col>
            <Col span={5}><Card><Statistic title="Sud" value={statistiques.sud} valueStyle={{ color: "#ea580c" }} /></Card></Col>
            <Col span={5}><Card><Statistic title="Est" value={statistiques.est} valueStyle={{ color: "#52c41a" }} /></Card></Col>
            <Col span={5}><Card><Statistic title="Ouest" value={statistiques.ouest} valueStyle={{ color: "#531DAB" }} /></Card></Col>
            <Col span={5}><Card><Statistic title="Centre" value={statistiques.centre} valueStyle={{ color: "cyan" }} /></Card></Col>
            <Col span={5}><Card><Statistic title="International" value={statistiques.international} valueStyle={{ color: "#CF1322" }} /></Card></Col>
          </Row>

          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Input prefix={<SearchOutlined />} placeholder="Rechercher destination" value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 400 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAjouter}>Ajouter destination</Button>
          </Space>

          <Table columns={columns} dataSource={filteredDestinations} rowKey="code_d" bordered pagination={{ pageSize: 10 }} locale={{ emptyText: <Empty /> }} />
        </Space>
      </Card>

      <Modal open={modalVisible} title={isEditing ? "Modifier Destination" : "Ajouter Destination"} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            const payload = {
              ville: values.ville,
              pays: values.pays || "Algérie",
              zone_geo: Array.isArray(values.zoneGeo) ? values.zoneGeo[0] : values.zoneGeo, // <-- correction ici
            };

            try {
              if (isEditing) await modifierDestination(selectedDestination.code_d, payload);
              else await ajouterDestination(payload);
            } catch (error) {
              console.error(error);
              message.error("Erreur lors de l'envoi des données");
            }

            setModalVisible(false);
            form.resetFields();
          }}
        >
          <Form.Item name="ville" label="Ville" rules={[{ required: true, message: "Veuillez entrer une ville" }]}><Input /></Form.Item>
          <Form.Item name="pays" label="Pays"><Input /></Form.Item>
          <Form.Item
            name="zoneGeo"
            label="Zone géographique"
            rules={[{ required: true, message: "Veuillez sélectionner une zone géographique !" }]}
          >
            <Select placeholder="Sélectionner une zone">
              <Option value="NORD">Nord</Option>
              <Option value="SUD">Sud</Option>
              <Option value="EST">Est</Option>
              <Option value="OUEST">Ouest</Option>
              <Option value="INTERNATIONAL">International</Option>
              <Option value="CENTRE">Centre</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={detailsVisible} onCancel={() => setDetailsVisible(false)} footer={[
        <Button key="close" onClick={() => setDetailsVisible(false)}>Fermer</Button>,
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => { setDetailsVisible(false); handleModifier(selectedDestination); }}>Modifier</Button>
      ]} title="Détails Destination">
        {selectedDestination && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Code">{selectedDestination.code_d}</Descriptions.Item>
            <Descriptions.Item label="Ville">{selectedDestination.ville}</Descriptions.Item>
            <Descriptions.Item label="Pays">{selectedDestination.pays}</Descriptions.Item>
            <Descriptions.Item label="Zone géographique">{selectedDestination.zone_geo}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Destination;
