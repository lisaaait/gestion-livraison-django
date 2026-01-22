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
  DatePicker,
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
import { TourneeContext } from "../../context/TourneeContext.jsx";
import { VehiculeContext } from "../../context/VehiculeContext.jsx";
import { ChauffeurContext } from "../../context/ChauffeurContext.jsx";
import { ExpeditionContext } from "../../context/ExpeditionContext.jsx";
import dayjs from "dayjs";

const Tournee = () => {
  const {
    tournees,
    statistiques,
    fetchTournees,
    ajouterTournee,
    changerStatutTournee,
    modifierTournee,
    supprimerTournee,
  } = useContext(TourneeContext);

  const { vehicules, fetchVehicules } = useContext(VehiculeContext);
  const { chauffeurs, fetchChauffeurs } = useContext(ChauffeurContext);
  const { expeditions, fetchExpeditions } = useContext(ExpeditionContext);

  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedTournee, setSelectedTournee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTournees();
    fetchVehicules();
    fetchChauffeurs();
    fetchExpeditions();
  }, [fetchTournees, fetchVehicules, fetchChauffeurs, fetchExpeditions]);

  const filteredTournees = tournees.filter(
    (t) =>
      (t.code_t || "").toLowerCase().includes(searchText.toLowerCase()) ||
      t.chauffeur?.toString().includes(searchText) ||
      t.vehicule?.toString().includes(searchText)
  );

  // Trouver les infos d'un chauffeur par son ID
  const getChauffeurInfo = (chauffeurId) => {
    const chauffeur = chauffeurs.find(c => c.id === chauffeurId || c.matricule === chauffeurId);
    return chauffeur ? `${chauffeur.nom} ${chauffeur.prenom}` : chauffeurId;
  };

  // Trouver les infos d'un véhicule par son matricule
  const getVehiculeInfo = (vehiculeId) => {
    const vehicule = vehicules.find(v => v.matricule === vehiculeId);
    return vehicule ? `${vehicule.matricule} - ${vehicule.type_vehicule}` : vehiculeId;
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case "EN_COURS":
        return "orange";
      case "TERMINEE":
        return "green";
      case "INCIDENT":
        return "red";
      default:
        return "default";
    }
  };

  const getNextStatut = (statut) => {
    switch (statut) {
      case "EN_COURS":
        return "TERMINEE";
      case "TERMINEE":
        return "EN_COURS";
      case "INCIDENT":
        return "EN_COURS";
      default:
        return "EN_COURS";
    }
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "code_t",
      key: "code_t",
      width: 120,
      fixed: "left",
    },
    {
      title: "Date",
      dataIndex: "date_tournee",
      render: (d) => dayjs(d).format("DD/MM/YYYY"),
      width: 140,
    },
    {
      title: "Chauffeur",
      dataIndex: "chauffeur",
      width: 180,
      render: (chauffeurId) => getChauffeurInfo(chauffeurId),
    },
    {
      title: "Véhicule",
      dataIndex: "vehicule",
      width: 180,
      render: (vehiculeId) => getVehiculeInfo(vehiculeId),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      width: 140,
      render: (s) => <Tag color={getStatutColor(s)}>{s}</Tag>,
    },
    {
      title: "Actions",
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTournee(record);
              setDetailsVisible(true);
            }}
          >
            Détails
          </Button>

          <Button
            type="link"
            icon={<SyncOutlined />}
            onClick={() => {
              const next = getNextStatut(record.statut);
              changerStatutTournee(record.code_t, next);
              message.success(`Statut changé vers ${next}`);
            }}
          >
            Changer statut
          </Button>

          <Popconfirm
            title="Supprimer cette tournée ?"
            onConfirm={() => supprimerTournee(record.code_t)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAjouter = () => {
    setIsEditing(false);
    setSelectedTournee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModifier = (tournee) => {
    setIsEditing(true);
    setSelectedTournee(tournee);
    form.setFieldsValue({
      date_tournee: dayjs(tournee.date_tournee),
      chauffeurId: tournee.chauffeur,
      vehiculeId: tournee.vehicule,
      expeditions: tournee.expeditions || [],
      statut: tournee.statut,
    });
    setModalVisible(true);
  };

  // Afficher tous les véhicules (tu peux filtrer par état si nécessaire)
  const vehiculesDisponibles = vehicules;

  // Filtrer uniquement les chauffeurs disponibles
  const chauffeursDisponibles = chauffeurs.filter(
    c => c.statut === "Disponible" || c.disponibilite === true
  );

  // Filtrer les expéditions non encore assignées à une tournée
  const expeditionsDisponibles = Array.isArray(expeditions) 
    ? expeditions.filter(exp => {
        const statutsValides = ['EN_ATTENTE', 'EN_TRANSIT'];
        return statutsValides.includes(exp.statut);
      })
    : [];

  // Log pour déboguer
  console.log("📦 Expéditions disponibles:", expeditionsDisponibles);
  if (expeditionsDisponibles.length > 0) {
    console.log("📦 Première expédition:", JSON.stringify(expeditionsDisponibles[0], null, 2));
    console.log("📦 Structure:", {
      id: expeditionsDisponibles[0].id,
      code: expeditionsDisponibles[0].code,
      numexp: expeditionsDisponibles[0].numexp,
      typeof_id: typeof expeditionsDisponibles[0].id,
      typeof_code: typeof expeditionsDisponibles[0].code,
    });
  }

  return (
    <div style={{ width: "84vw" }}>
      <Card title="Gestion des Tournées">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Stats */}
          <Row gutter={16} style={{ justifyContent: "center" }}>
            <Col span={4}>
              <Card>
                <Statistic title="Total" value={statistiques.total} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="Aujourd'hui" value={statistiques.aujourdHui} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Planifiées"
                  value={statistiques.Planifiée}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="En cours"
                  value={statistiques.Encours}
                  valueStyle={{ color: "#ea580c" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Terminées"
                  value={statistiques.Terminées}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>

          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Rechercher tournée"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 400 }}
            />

            <Button type="primary" icon={<PlusOutlined />} onClick={handleAjouter}>
              Ajouter tournée
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredTournees}
            rowKey="code_t"
            bordered
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="Aucune tournée" /> }}
          />
        </Space>
      </Card>

      {/* Modal Ajout / Modification */}
      <Modal
        open={modalVisible}
        title={isEditing ? "Modifier Tournée" : "Ajouter Tournée"}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            try {
              setLoading(true);
              
              // Validation : au moins une expédition doit être sélectionnée
              if (!values.expeditions || values.expeditions.length === 0) {
                message.error("Veuillez sélectionner au moins une expédition");
                setLoading(false);
                return;
              }

              const data = {
                code_t: values.code_t, // Inclure le code
                date_tournee: values.date_tournee.format("YYYY-MM-DD"),
                chauffeur: values.chauffeurId,
                vehicule: values.vehiculeId,
                expeditions: values.expeditions,
                statut: values.statut || "EN_COURS",
              };

              if (isEditing) {
                await modifierTournee(selectedTournee.code_t, data);
                message.success("Tournée modifiée");
              } else {
                await ajouterTournee(data);
                message.success("Tournée ajoutée");
              }

              setModalVisible(false);
              form.resetFields();
            } catch (error) {
              console.error(error);
              message.error(error.response?.data ? JSON.stringify(error.response.data) : "Erreur lors de l'enregistrement");
            } finally {
              setLoading(false);
            }
          }}
        >
<Form.Item
  name="expeditions"
  label="Expéditions"
  rules={[
    { required: true, message: "Veuillez sélectionner au moins une expédition" },
  ]}
>
  <Select
    mode="multiple"
    placeholder="Sélectionner les expéditions"
    showSearch
    optionFilterProp="children"
    filterOption={(input, option) =>
      option.children.toLowerCase().includes(input.toLowerCase())
    }
  >
    {expeditionsDisponibles.map((exp) => (
      <Select.Option
        key={exp.numexp}        // ✅ clé React
        value={exp.numexp}      // ✅ PK Django (OBLIGATOIRE)
      >
        EXP-{exp.numexp} | Client {exp.clientId} | {exp.poids}kg
      </Select.Option>
    ))}
  </Select>
</Form.Item>


          <Form.Item
            name="code_t"
            label="Code tournée"
            rules={[{ required: true, message: "Veuillez saisir le code" }]}
          >
            <Input placeholder="Ex: TRN001" maxLength={10} />
          </Form.Item>

          <Form.Item
            name="date_tournee"
            label="Date de la tournée"
            rules={[{ required: true, message: "Veuillez sélectionner une date" }]}
          >
            <DatePicker 
              style={{ width: "100%" }} 
              format="DD/MM/YYYY"
              placeholder="Sélectionner une date"
            />
          </Form.Item>

          <Form.Item
            name="chauffeurId"
            label="Chauffeur"
            rules={[{ required: true, message: "Veuillez sélectionner un chauffeur" }]}
          >
            <Select
              placeholder="Sélectionner un chauffeur"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {chauffeursDisponibles.map((chauffeur) => (
                <Select.Option 
                  key={chauffeur.id || chauffeur.matricule} 
                  value={chauffeur.id || chauffeur.matricule}
                >
                  {chauffeur.nom} {chauffeur.prenom} ({chauffeur.matricule})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="vehiculeId"
            label="Véhicule"
            rules={[{ required: true, message: "Veuillez sélectionner un véhicule" }]}
          >
            <Select
              placeholder="Sélectionner un véhicule"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {vehiculesDisponibles.map((vehicule) => (
                <Select.Option key={vehicule.matricule} value={vehicule.matricule}>
                  {vehicule.matricule} - {vehicule.type_vehicule} 
                  ({vehicule.capacite_poids}kg / {vehicule.capacite_volume}m³)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="statut" 
            label="Statut"
            initialValue="EN_COURS"
          >
            <Select>
              <Select.Option value="EN_COURS">En cours</Select.Option>
              <Select.Option value="TERMINEE">Terminée</Select.Option>
              <Select.Option value="INCIDENT">Incident</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Détails */}
      <Modal
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setDetailsVisible(false);
              handleModifier(selectedTournee);
            }}
          >
            Modifier
          </Button>,
        ]}
        title="Détails Tournée"
        width={600}
      >
        {selectedTournee && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Code">
              {selectedTournee.code_t}
            </Descriptions.Item>

            <Descriptions.Item label="Date">
              {dayjs(selectedTournee.date_tournee).format("DD/MM/YYYY")}
            </Descriptions.Item>

            <Descriptions.Item label="Chauffeur">
              {getChauffeurInfo(selectedTournee.chauffeur)}
            </Descriptions.Item>

            <Descriptions.Item label="Véhicule">
              {getVehiculeInfo(selectedTournee.vehicule)}
            </Descriptions.Item>

            <Descriptions.Item label="Statut">
              <Tag color={getStatutColor(selectedTournee.statut)}>
                {selectedTournee.statut}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Tournee;