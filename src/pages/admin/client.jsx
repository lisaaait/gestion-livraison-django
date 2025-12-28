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
  Select,
  message,
  Popconfirm,
  Descriptions,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { ClientContext } from "../../context/clientContext";

const { TextArea } = Input;
const { TabPane } = Tabs;

const client = () => {
  const {
    clients,
    fetchClients,
    ajouterClient,
    modifierClient,
    supprimerClient,
    getExpeditionsClient,
    getFacturesClient,
  } = useContext(ClientContext);

  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(
    (client) =>
      client.nom.toLowerCase().includes(searchText.toLowerCase()) ||
      client.code.toLowerCase().includes(searchText.toLowerCase()) ||
      client.email.toLowerCase().includes(searchText.toLowerCase()) ||
      client.telephone.includes(searchText) ||
      client.ville.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAjouterClient = () => {
    setIsEditing(false);
    setSelectedClient(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModifierClient = (client) => {
    setIsEditing(true);
    setSelectedClient(client);
    form.setFieldsValue(client);
    setModalVisible(true);
  };

  const handleVoirDetails = (client) => {
    setSelectedClient(client);
    setDetailsVisible(true);
  };

  const handleModalSubmit = async (values) => {
    try {
      if (isEditing) {
        await modifierClient(selectedClient.id, values);
        message.success("Client modifié avec succès");
      } else {
        await ajouterClient(values);
        message.success("Client ajouté avec succès");
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Une erreur s'est produite");
    }
  };

  const handleSupprimerClient = async (id) => {
    try {
      await supprimerClient(id);
      message.success("Client supprimé avec succès");
    } catch (error) {
      message.error("Une erreur s'est produite");
    }
  };

  const handleImprimerListe = () => {
    message.info("Impression de la liste des clients...");
    // Logique d'impression à implémenter
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case "actif":
        return "green";
      case "inactif":
        return "orange";
      case "suspendu":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 120,
      sorter: (a, b) => a.code.localeCompare(b.code),
      fixed: "left",
    },
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      width: 200,
      sorter: (a, b) => a.nom.localeCompare(b.nom),
    },
    {
      title: "Type",
      dataIndex: "typeClient",
      key: "typeClient",
      width: 120,
      filters: [
        { text: "Entreprise", value: "Entreprise" },
        { text: "Particulier", value: "Particulier" },
      ],
      onFilter: (value, record) => record.typeClient === value,
      render: (type) => (
        <Tag color={type === "Entreprise" ? "blue" : "cyan"}>{type}</Tag>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Téléphone",
      dataIndex: "telephone",
      key: "telephone",
      width: 130,
    },
    {
      title: "Ville",
      dataIndex: "ville",
      key: "ville",
      width: 130,
    },
    {
      title: "Solde",
      dataIndex: "solde",
      key: "solde",
      width: 130,
      sorter: (a, b) => a.solde - b.solde,
      render: (solde) => (
        <span style={{ color: solde > 0 ? "#ff4d4f" : "#52c41a", fontWeight: "bold" }}>
          {solde.toLocaleString()} DA
        </span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 120,
      filters: [
        { text: "Actif", value: "actif" },
        { text: "Inactif", value: "inactif" },
        { text: "Suspendu", value: "suspendu" },
      ],
      onFilter: (value, record) => record.statut === value,
      render: (statut) => (
        <Tag color={getStatutColor(statut)}>{statut.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Date d'inscription",
      dataIndex: "dateInscription",
      key: "dateInscription",
      width: 150,
      sorter: (a, b) => new Date(a.dateInscription) - new Date(b.dateInscription),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleVoirDetails(record)}
            size="small"
          >
            Détails
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleModifierClient(record)}
            size="small"
          >
            Modifier
          </Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce client ?"
            description="Cette action est irréversible."
            onConfirm={() => handleSupprimerClient(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Card title="Gestion des Clients" bordered={false} style={{ width: "100%" }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Input
              placeholder="Rechercher par nom, code, email, téléphone ou ville"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 500 }}
              allowClear
            />
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAjouterClient}
              >
                Ajouter un client
              </Button>
              <Button icon={<PrinterOutlined />} onClick={handleImprimerListe}>
                Imprimer la liste
              </Button>
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredClients}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} clients`,
            }}
            scroll={{ x: 1600 }}
            bordered
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchText
                      ? `Aucun client trouvé pour "${searchText}"`
                      : "Aucun client disponible"
                  }
                />
              ),
            }}
          />
        </Space>
      </Card>

      {/* Modal Ajouter/Modifier Client */}
      <Modal
        title={isEditing ? "Modifier un client" : "Ajouter un client"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={isEditing ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item
            name="nom"
            label="Nom / Raison sociale"
            rules={[{ required: true, message: "Veuillez saisir le nom" }]}
          >
            <Input placeholder="Ex: Société ALPHA" />
          </Form.Item>

          <Form.Item
            name="typeClient"
            label="Type de client"
            rules={[{ required: true, message: "Veuillez sélectionner le type" }]}
          >
            <Select placeholder="Sélectionner un type">
              <Select.Option value="Entreprise">Entreprise</Select.Option>
              <Select.Option value="Particulier">Particulier</Select.Option>
            </Select>
          </Form.Item>

          <Space style={{ width: "100%" }} size="large">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Veuillez saisir l'email" },
                { type: "email", message: "Email invalide" },
              ]}
              style={{ width: "48%" }}
            >
              <Input placeholder="contact@example.dz" />
            </Form.Item>

            <Form.Item
              name="telephone"
              label="Téléphone"
              rules={[{ required: true, message: "Veuillez saisir le téléphone" }]}
              style={{ width: "48%" }}
            >
              <Input placeholder="0555123456" />
            </Form.Item>
          </Space>

          <Form.Item
            name="adresse"
            label="Adresse"
            rules={[{ required: true, message: "Veuillez saisir l'adresse" }]}
          >
            <Input placeholder="12 Rue Didouche Mourad" />
          </Form.Item>

          <Space style={{ width: "100%" }} size="large">
            <Form.Item
              name="ville"
              label="Ville"
              rules={[{ required: true, message: "Veuillez saisir la ville" }]}
              style={{ width: "48%" }}
            >
              <Input placeholder="Alger" />
            </Form.Item>

            <Form.Item
              name="codePostal"
              label="Code postal"
              rules={[{ required: true, message: "Veuillez saisir le code postal" }]}
              style={{ width: "48%" }}
            >
              <Input placeholder="16000" />
            </Form.Item>
          </Space>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.typeClient !== currentValues.typeClient
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("typeClient") === "Entreprise" ? (
                <Space style={{ width: "100%" }} size="large">
                  <Form.Item name="nif" label="NIF" style={{ width: "48%" }}>
                    <Input placeholder="099916000123456" />
                  </Form.Item>

                  <Form.Item name="rc" label="RC" style={{ width: "48%" }}>
                    <Input placeholder="16/00-1234567" />
                  </Form.Item>
                </Space>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="statut"
            label="Statut"
            rules={[{ required: true, message: "Veuillez sélectionner le statut" }]}
            initialValue="actif"
          >
            <Select>
              <Select.Option value="actif">Actif</Select.Option>
              <Select.Option value="inactif">Inactif</Select.Option>
              <Select.Option value="suspendu">Suspendu</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="noteInterne" label="Note interne">
            <TextArea rows={3} placeholder="Notes ou observations..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Détails Client */}
      <Modal
        title={`Détails du client ${selectedClient?.code}`}
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
              handleModifierClient(selectedClient);
            }}
          >
            Modifier
          </Button>,
        ]}
        width={900}
      >
        {selectedClient && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Informations générales" key="1">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Code" span={1}>
                  {selectedClient.code}
                </Descriptions.Item>
                <Descriptions.Item label="Statut" span={1}>
                  <Tag color={getStatutColor(selectedClient.statut)}>
                    {selectedClient.statut.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Nom / Raison sociale" span={2}>
                  {selectedClient.nom}
                </Descriptions.Item>
                <Descriptions.Item label="Type" span={1}>
                  {selectedClient.typeClient}
                </Descriptions.Item>
                <Descriptions.Item label="Date d'inscription" span={1}>
                  {selectedClient.dateInscription}
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  {selectedClient.email}
                </Descriptions.Item>
                <Descriptions.Item label="Téléphone" span={1}>
                  {selectedClient.telephone}
                </Descriptions.Item>
                <Descriptions.Item label="Adresse" span={2}>
                  {selectedClient.adresse}
                </Descriptions.Item>
                <Descriptions.Item label="Ville" span={1}>
                  {selectedClient.ville}
                </Descriptions.Item>
                <Descriptions.Item label="Code postal" span={1}>
                  {selectedClient.codePostal}
                </Descriptions.Item>
                {selectedClient.typeClient === "Entreprise" && (
                  <>
                    <Descriptions.Item label="NIF" span={1}>
                      {selectedClient.nif || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="RC" span={1}>
                      {selectedClient.rc || "-"}
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="Solde" span={2}>
                  <span
                    style={{
                      color: selectedClient.solde > 0 ? "#ff4d4f" : "#52c41a",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {selectedClient.solde.toLocaleString()} DA
                  </span>
                </Descriptions.Item>
                {selectedClient.noteInterne && (
                  <Descriptions.Item label="Note interne" span={2}>
                    {selectedClient.noteInterne}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </TabPane>

            <TabPane tab="Historique des expéditions" key="2">
              <Table
                dataSource={getExpeditionsClient(selectedClient.id)}
                columns={[
                  { title: "Code", dataIndex: "code", key: "code" },
                  { title: "Destination", dataIndex: "destination", key: "destination" },
                  { title: "Date", dataIndex: "date", key: "date" },
                  {
                    title: "Statut",
                    dataIndex: "statut",
                    key: "statut",
                    render: (statut) => (
                      <Tag color={statut === "livrée" ? "green" : "orange"}>
                        {statut.toUpperCase()}
                      </Tag>
                    ),
                  },
                  {
                    title: "Montant",
                    dataIndex: "montant",
                    key: "montant",
                    render: (montant) => `${montant.toLocaleString()} DA`,
                  },
                ]}
                pagination={{ pageSize: 5 }}
                size="small"
                locale={{
                  emptyText: "Aucune expédition pour ce client",
                }}
              />
            </TabPane>

            <TabPane tab="Historique des factures" key="3">
              <Table
                dataSource={getFacturesClient(selectedClient.id)}
                columns={[
                  { title: "N° Facture", dataIndex: "numeroFacture", key: "numeroFacture" },
                  { title: "Date", dataIndex: "date", key: "date" },
                  {
                    title: "Montant TTC",
                    dataIndex: "montantTTC",
                    key: "montantTTC",
                    render: (montant) => `${montant.toLocaleString()} DA`,
                  },
                  {
                    title: "Statut",
                    dataIndex: "statut",
                    key: "statut",
                    render: (statut) => {
                      const color =
                        statut === "payée"
                          ? "green"
                          : statut === "partiellement payée"
                          ? "orange"
                          : "red";
                      return <Tag color={color}>{statut.toUpperCase()}</Tag>;
                    },
                  },
                ]}
                pagination={{ pageSize: 5 }}
                size="small"
                locale={{
                  emptyText: "Aucune facture pour ce client",
                }}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default client;