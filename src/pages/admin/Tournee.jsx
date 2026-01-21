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

  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedTournee, setSelectedTournee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTournees();
  }, [fetchTournees]);

  const filteredTournees = tournees.filter(
    (t) =>
      (t.code_t || "").toLowerCase().includes(searchText.toLowerCase()) ||
      t.chauffeur?.toString().includes(searchText) ||
      t.vehicule?.toString().includes(searchText)
  );

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
      title: "Chauffeur ID",
      dataIndex: "chauffeur",
      width: 140,
    },
    {
      title: "Véhicule ID",
      dataIndex: "vehicule",
      width: 140,
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
                <Statistic title="aujourdHui" value={statistiques.aujourdHui} />
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
            locale={{ emptyText: <Empty /> }}
          />
        </Space>
      </Card>

      {/* Modal Ajout / Modification */}
      <Modal
        open={modalVisible}
        title={isEditing ? "Modifier Tournée" : "Ajouter Tournée"}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={async (values) => {
            try {
              const data = {
                date_tournee: values.date_tournee.format("YYYY-MM-DD"),
                chauffeur: values.chauffeurId,
                vehicule: values.vehiculeId,
                expeditions: values.expeditions || [],
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
              message.error("Erreur lors de l'enregistrement de la tournée");
            }
          }}
        >
          <Form.Item
            name="date_tournee"
            label="Date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="chauffeurId"
            label="Chauffeur ID"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="vehiculeId"
            label="Véhicule ID"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          {/* Optionnel : sélection expéditions */}
          {/* <Form.Item name="expeditions" label="Expéditions">
            <Select mode="multiple" placeholder="Sélectionner les expéditions">
              { /* options à remplir dynamiquement si nécessaire */}
            {/* </Select>
          </Form.Item> */}

          <Form.Item name="statut" label="Statut">
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
      >
        {selectedTournee && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Code">
              {selectedTournee.code_t}
            </Descriptions.Item>

            <Descriptions.Item label="Date">
              {dayjs(selectedTournee.date_tournee).format("DD/MM/YYYY")}
            </Descriptions.Item>

            <Descriptions.Item label="Chauffeur ID">
              {selectedTournee.chauffeur}
            </Descriptions.Item>

            <Descriptions.Item label="Véhicule ID">
              {selectedTournee.vehicule}
            </Descriptions.Item>

            <Descriptions.Item label="Statut">
              {selectedTournee.statut}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Tournee;
