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
  Spin,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  SyncOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { ChauffeurContext } from "../../context/ChauffeurContext.jsx";

const Chauffeur = () => {
  const {
    chauffeurs,
    statistiques,
    loading, // Ajouté depuis le context
    fetchChauffeurs,
    ajouterChauffeur,
    changerStatutChauffeur,
    modifierChauffeur,
    supprimerChauffeur,
  } = useContext(ChauffeurContext);

  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchChauffeurs();
  }, [fetchChauffeurs]);

  // Filtrage local pour la recherche
  const filteredChauffeurs = chauffeurs.filter(
    (ch) =>
      ch.codeChauffeur?.toLowerCase().includes(searchText.toLowerCase()) ||
      ch.nom?.toLowerCase().includes(searchText.toLowerCase()) ||
      ch.numeroPermis?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSupprimerChauffeur = async (id) => {
    try {
      await supprimerChauffeur(id);
      message.success("Chauffeur supprimé avec succès");
    } catch (error) {
      message.error("Erreur lors de la suppression");
    }
  };

  const getStatutColor = (statut) => {
    return statut === "Disponible" ? "green" : "blue";
  };

  const getNextStatut = (statut) => {
    return statut === "Disponible" ? "En mission" : "Disponible";
  };

  const columns = [
    { title: "Code", dataIndex: "codeChauffeur", key: "codeChauffeur", width: 120 },
    { title: "Nom", dataIndex: "nom", key: "nom", width: 200 },
    { title: "N° Permis", dataIndex: "numeroPermis", key: "numeroPermis", width: 160 },
    { title: "Catégorie", dataIndex: "categoriePermis", key: "categoriePermis", width: 120 },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 140,
      render: (s) => <Tag color={getStatutColor(s)}>{s}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedChauffeur(record);
              setDetailsVisible(true);
            }}
          >
            Détails
          </Button>
          <Button
            type="link"
            icon={<SyncOutlined />}
            onClick={() => {
              const nextStatut = getNextStatut(record.statut);
              changerStatutChauffeur(record.codeChauffeur, nextStatut);
            }}
          >
            Changer statut
          </Button>
          <Popconfirm
            title="Supprimer ce chauffeur ?"
            onConfirm={() => handleSupprimerChauffeur(record.codeChauffeur)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAjouterChauffeur = () => {
    setIsEditing(false);
    setSelectedChauffeur(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModifierChauffeur = (chauffeur) => {
    setIsEditing(true);
    setSelectedChauffeur(chauffeur);
    form.setFieldsValue(chauffeur);
    setModalVisible(true);
  };

  const onFinish = async (values) => {
    try {
      if (isEditing) {
        await modifierChauffeur(selectedChauffeur.codeChauffeur, values);
        message.success("Chauffeur mis à jour");
      } else {
        await ajouterChauffeur(values);
        message.success("Chauffeur créé");
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Erreur lors de l'opération");
    }
  };

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh", width: "84vw" }}>
      <Card title="Module Transport : Gestion des Chauffeurs">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Statistiques */}
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Total Chauffeurs" value={statistiques.total} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Disponibles" value={statistiques.disponibles} valueStyle={{ color: "#52c41a" }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="En mission" value={statistiques.enMission} valueStyle={{ color: "#1890ff" }} />
              </Card>
            </Col>
          </Row>

          {/* Barre de recherche et Bouton */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Rechercher par nom ou permis..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 400 }}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAjouterChauffeur}>
              Nouveau Chauffeur
            </Button>
          </div>

          {/* Table avec gestion du loading */}
          <Table
            columns={columns}
            dataSource={filteredChauffeurs}
            rowKey="codeChauffeur"
            bordered
            loading={loading}
            locale={{ emptyText: <Empty description="Aucun chauffeur trouvé" /> }}
          />
        </Space>
      </Card>

      {/* Modal Ajout / Modification */}
      <Modal
        open={modalVisible}
        title={isEditing ? "Modifier le profil" : "Enregistrer un nouveau chauffeur"}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="codeChauffeur" 
                label="Code Chauffeur" 
                rules={[{ required: true, message: "Le code est obligatoire" }]}
              >
                <Input disabled={isEditing} placeholder="Ex: CH001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nom" label="Nom Complet" rules={[{ required: true }]}>
                <Input placeholder="Nom et Prénom" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="numeroPermis" label="N° de Permis (10 chiffres)" rules={[{ required: true, len: 10 }]}>
                <Input placeholder="0011223344" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoriePermis" label="Catégorie" rules={[{ required: true }]}>
                <Select placeholder="Sélectionner">
                  <Select.Option value="A">Moto (A)</Select.Option>
                  <Select.Option value="B">Voiture (B)</Select.Option>
                  <Select.Option value="C">Camion (C)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Détails */}
      <Modal
        open={detailsVisible}
        title="Fiche Chauffeur"
        onCancel={() => setDetailsVisible(false)}
        footer={[<Button key="ok" onClick={() => setDetailsVisible(false)}>Fermer</Button>]}
      >
        {selectedChauffeur && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Identifiant">{selectedChauffeur.codeChauffeur}</Descriptions.Item>
            <Descriptions.Item label="Nom">{selectedChauffeur.nom}</Descriptions.Item>
            <Descriptions.Item label="N° Permis">{selectedChauffeur.numeroPermis}</Descriptions.Item>
            <Descriptions.Item label="Catégorie">{selectedChauffeur.categoriePermis}</Descriptions.Item>
            <Descriptions.Item label="Statut actuel">
               <Tag color={getStatutColor(selectedChauffeur.statut)}>{selectedChauffeur.statut}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Chauffeur;