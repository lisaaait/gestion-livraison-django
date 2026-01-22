import React, { useContext, useEffect, useState } from "react";
import {
  Table, Button, Space, Tag, Input, Card, Empty, Modal, Form,
  Select, InputNumber, message, Descriptions, Row, Col, Statistic, Popconfirm
} from "antd";
import {
  SearchOutlined, EyeOutlined, PlusOutlined, SyncOutlined, DeleteOutlined, EditOutlined
} from "@ant-design/icons";
import { VehiculeContext } from "../../context/VehiculeContext.jsx";

const Vehicules = () => {
  const {
    vehicules,
    statistiques,
    fetchVehicules,
    ajouterVehicule,
    changerEtatVehicule,
    modifierVehicule,
    supprimerVehicule,
  } = useContext(VehiculeContext);

  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchVehicules();
  }, [fetchVehicules]);

  const filteredVehicules = vehicules.filter(
    (v) =>
      v.matricule.toLowerCase().includes(searchText.toLowerCase()) ||
      v.type_vehicule.toLowerCase().includes(searchText.toLowerCase())
  );

  const getEtatColor = (etat) => {
    switch (etat) {
      case "Opérationnel":
      case "Disponible": 
        return "green";
      case "En mission": 
        return "blue";
      case "En maintenance": 
        return "orange";
      default: 
        return "default";
    }
  };

  const getNextEtat = (etat) => {
    switch (etat) {
      case "Opérationnel":
      case "Disponible": 
        return "En mission";
      case "En mission": 
        return "En maintenance";
      case "En maintenance": 
        return "Opérationnel";
      default: 
        return "Opérationnel";
    }
  };

  const handleSupprimerVehicule = async (matricule) => {
    try {
      await supprimerVehicule(matricule);
      message.success("Véhicule supprimé avec succès");
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  const handleAjouterModifier = async (values) => {
    try {
      if (isEditing) {
        await modifierVehicule(selectedVehicule.matricule, values);
        message.success("Véhicule modifié");
      } else {
        await ajouterVehicule(values);
        message.success("Véhicule ajouté");
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      const errorMsg = error.response?.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
      message.error(`Erreur: ${errorMsg}`);
    }
  };

  const columns = [
    { title: "Matricule", dataIndex: "matricule", width: 140 },
    { title: "Type", dataIndex: "type_vehicule", width: 180 },
    { title: "Capacité poids", dataIndex: "capacite_poids", render: v => `${v} kg` },
    { title: "Capacité volume", dataIndex: "capacite_volume", render: v => `${v} m³` },
    { title: "État", dataIndex: "etat", render: etat => <Tag color={getEtatColor(etat)}>{etat}</Tag> },
    {
      title: "Actions",
      width: 260,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelectedVehicule(record); setDetailsVisible(true); }}>
            Détails
          </Button>
          <Button type="link" icon={<SyncOutlined />} onClick={() => {
            const nextEtat = getNextEtat(record.etat);
            changerEtatVehicule(record.matricule, nextEtat);
            message.success(`État changé vers ${nextEtat}`);
          }}>
            Changer état
          </Button>
          <Popconfirm
            title="Êtes-vous sûr ?"
            onConfirm={() => handleSupprimerVehicule(record.matricule)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: "84vw" }}>
      <Card title="Gestion des Véhicules" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Statistiques */}
          <Row gutter={16}>
            <Col span={6}><Card><Statistic title="Total" value={statistiques.total} /></Card></Col>
            <Col span={6}><Card><Statistic title="Disponible" value={statistiques.disponibles} valueStyle={{ color: "#52c41a" }} /></Card></Col>
            <Col span={6}><Card><Statistic title="En mission" value={statistiques.enMission} valueStyle={{ color: "#1890ff" }} /></Card></Col>
            <Col span={6}><Card><Statistic title="Indisponible" value={statistiques.enMaintenance} valueStyle={{ color: "#ea580c" }} /></Card></Col>
          </Row>

          {/* Recherche + Ajouter */}
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Rechercher"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 420 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setIsEditing(false); setSelectedVehicule(null); form.resetFields(); setModalVisible(true); }}
            >
              Ajouter véhicule
            </Button>
          </Space>

          {/* Tableau */}
          <Table
            columns={columns}
            dataSource={filteredVehicules}
            rowKey="matricule"
            bordered
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="Aucun véhicule" /> }}
          />
        </Space>
      </Card>

      {/* Modal Ajouter / Modifier */}
      <Modal
        open={modalVisible}
        title={isEditing ? "Modifier véhicule" : "Ajouter véhicule"}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={isEditing ? "Modifier" : "Ajouter"}
      >
        <Form layout="vertical" form={form} onFinish={handleAjouterModifier}>
          <Form.Item 
            name="matricule" 
            label="Matricule (max 6 caractères)" 
            rules={[
              { required: true, message: "Veuillez saisir le matricule" },
              { max: 6, message: "Le matricule ne peut pas dépasser 6 caractères" },
              { pattern: /^[A-Za-z0-9]+$/, message: "Uniquement lettres et chiffres" }
            ]}
          >
            <Input maxLength={6} placeholder="Ex: ABC123" />
          </Form.Item>
          <Form.Item name="type_vehicule" label="Type de véhicule" rules={[{ required: true }]}>
            <Select placeholder="Choisir un type">
              <Select.Option value="MOTO">MOTO</Select.Option>
              <Select.Option value="VOITURE">VOITURE</Select.Option>
              <Select.Option value="CAMION">CAMION</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="capacite_poids" 
            label="Capacité poids (kg)" 
            rules={[
              { required: true, message: "Veuillez saisir la capacité" }
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="capacite_volume" label="Capacité volume (m³)" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Détails */}
      <Modal
        open={detailsVisible}
        title={`Véhicule ${selectedVehicule?.matricule}`}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>Fermer</Button>,
        ]}
        onCancel={() => setDetailsVisible(false)}
      >
        {selectedVehicule && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Type">{selectedVehicule.type_vehicule}</Descriptions.Item>
            <Descriptions.Item label="Capacité poids">{selectedVehicule.capacite_poids} kg</Descriptions.Item>
            <Descriptions.Item label="Capacité volume">{selectedVehicule.capacite_volume} m³</Descriptions.Item>
            <Descriptions.Item label="État"><Tag color={getEtatColor(selectedVehicule.etat)}>{selectedVehicule.etat}</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Vehicules;