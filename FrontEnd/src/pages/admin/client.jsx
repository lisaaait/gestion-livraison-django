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
  Spin,
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
    loading,
  } = useContext(ClientContext);

  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const [expeditions, setExpeditions] = useState([]);
  const [factures, setFactures] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const safeString = (v) => (v === null || v === undefined ? "" : String(v));

  const filteredClients =
    Array.isArray(clients) && clients.length
      ? clients.filter((c) => {
          const q = safeString(searchText).toLowerCase();
          const nom = safeString(c.nom).toLowerCase();
          const prenom = safeString(c.prenom).toLowerCase();
          const code = safeString(c.code).toLowerCase();
          const email = safeString(c.email).toLowerCase();
          const telephone = safeString(c.telephone);

          return (
            nom.includes(q) ||
            prenom.includes(q) ||
            code.includes(q) ||
            email.includes(q) ||
            telephone.includes(searchText)
          );
        })
      : [];

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

  const handleVoirDetails = async (client) => {
    setSelectedClient(client);
    setDetailsVisible(true);
    setDetailsLoading(true);
    try {
      const ex = await getExpeditionsClient(client.id);
      setExpeditions(Array.isArray(ex) ? ex : []);
    } catch (e) {
      setExpeditions([]);
    }
    try {
      const fc = await getFacturesClient(client.id);
      setFactures(Array.isArray(fc) ? fc : []);
    } catch (e) {
      setFactures([]);
    }
    setDetailsLoading(false);
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
      console.error("Erreur create/modify client:", error);
      const errMsg =
        (error?.response && JSON.stringify(error.response.data)) ||
        error.message ||
        "Une erreur s'est produite";
      message.error(errMsg);
    }
  };

  const handleSupprimerClient = async (recordOrId) => {
    try {
      await supprimerClient(recordOrId);
      message.success("Client supprimé avec succès");
    } catch (error) {
      console.error("Erreur suppression (ui):", error);
      const errMsg =
        (error?.response && JSON.stringify(error.response.data)) ||
        error.message ||
        "Une erreur s'est produite lors de la suppression";
      message.error(errMsg);
    }
  };

  const handleImprimerListe = () => {
    message.info("Impression de la liste des clients...");
  };

  const columns = [
    { title: "Code", dataIndex: "code", key: "code", width: 120, sorter: (a, b) => safeString(a.code).localeCompare(safeString(b.code)), fixed: "left" },
    { title: "Prénom", dataIndex: "prenom", key: "prenom", width: 150, render: (p) => safeString(p) },
    { title: "Nom", dataIndex: "nom", key: "nom", width: 200, sorter: (a, b) => safeString(a.nom).localeCompare(safeString(b.nom)) },
    { title: "Email", dataIndex: "email", key: "email", width: 200, render: (e) => safeString(e) },
    { title: "Téléphone", dataIndex: "telephone", key: "telephone", width: 130, render: (t) => safeString(t) },
    { title: "Adresse", dataIndex: "adresse", key: "adresse", width: 200, render: (v) => safeString(v) },
    { title: "Solde", dataIndex: "solde", key: "solde", width: 130, sorter: (a, b) => (Number(a.solde) || 0) - (Number(b.solde) || 0), render: (solde) => { const num = Number(solde || 0); return <span style={{ color: num > 0 ? "#ff4d4f" : "#52c41a", fontWeight: "bold" }}>{num.toLocaleString()} DA</span>; } },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleVoirDetails(record)} size="small">Détails</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleModifierClient(record)} size="small">Modifier</Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce client ?"
            description="Cette action est irréversible."
            onConfirm={() => handleSupprimerClient(record)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowKeyFn = (record) => record.id ?? record.code ?? record.CodeClient ?? record.Email ?? JSON.stringify(record);

  return (
    <div style={{ 
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      padding: "20px"
    }}>
      <Card 
        title="Gestion des Clients" 
        style={{ 
          height: "100%",
          display: "flex",
          flexDirection: "column"
        }}
        bodyStyle={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "24px"
        }}
      >
        <Space style={{ width: "100%", marginBottom: 16, flexShrink: 0 }}>
          <Input 
            placeholder="Rechercher par nom, prénom, code, email ou téléphone" 
            prefix={<SearchOutlined />} 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)} 
            style={{ width: 500 }} 
            allowClear 
          />
          <Space style={{ marginLeft: "auto" }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAjouterClient}>
              Ajouter un client
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handleImprimerListe}>
              Imprimer la liste
            </Button>
          </Space>
        </Space>

        <div style={{ flex: 1, minHeight: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table 
              columns={columns} 
              dataSource={filteredClients} 
              rowKey={rowKeyFn} 
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Total: ${total} clients` 
              }} 
              scroll={{ 
                x: 1600,
                y: "100%"
              }} 
              locale={{ 
                emptyText: (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description={searchText ? `Aucun client trouvé pour "${searchText}"` : "Aucun client disponible"} 
                  />
                ) 
              }} 
            />
          )}
        </div>
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
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Space style={{ width: "100%" }} size="large">
              <Form.Item 
                name="nom" 
                label="Nom / Raison sociale" 
                rules={[{ required: true, message: "Veuillez saisir le nom" }]} 
                style={{ width: "48%" }}
              >
                <Input placeholder="Ex: Société ALPHA" />
              </Form.Item>

              <Form.Item 
                name="prenom" 
                label="Prénom" 
                style={{ width: "48%" }}
              >
                <Input placeholder="Prénom" />
              </Form.Item>
            </Space>

            <Space style={{ width: "100%" }} size="large">
              <Form.Item 
                name="email" 
                label="Email" 
                rules={[
                  { required: true, message: "Veuillez saisir l'email" }, 
                  { type: "email", message: "Email invalide" }
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
                name="codePostal" 
                label="Code postal" 
                rules={[{ required: false }]} 
                style={{ width: "48%" }}
              >
                <Input placeholder="16000" />
              </Form.Item>

              <Form.Item 
                name="solde" 
                label="Solde" 
                rules={[{ required: false }]} 
                style={{ width: "48%" }}
              >
                <Input placeholder="123333.00" />
              </Form.Item>
            </Space>

            <Form.Item 
              name="nif" 
              label="NIF" 
              style={{ width: "48%" }}
            >
              <Input placeholder="099916000123456" />
            </Form.Item>

            <Form.Item 
              name="rc" 
              label="RC" 
              style={{ width: "48%" }}
            >
              <Input placeholder="16/00-1234567" />
            </Form.Item>

            <Form.Item 
              name="noteInterne" 
              label="Note interne"
            >
              <TextArea rows={3} placeholder="Notes ou observations..." />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* Modal Détails */}
      <Modal 
        title={`Détails du client ${safeString(selectedClient?.code)}`} 
        open={detailsVisible} 
        onCancel={() => { 
          setDetailsVisible(false); 
          setSelectedClient(null); 
          setExpeditions([]); 
          setFactures([]); 
        }} 
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
                  {safeString(selectedClient.code || selectedClient.CodeClient)}
                </Descriptions.Item>
                <Descriptions.Item label="Prénom" span={1}>
                  {safeString(selectedClient.prenom || selectedClient.Prenom)}
                </Descriptions.Item>
                <Descriptions.Item label="Nom / Raison sociale" span={1}>
                  {safeString(selectedClient.nom || selectedClient.Nom)}
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  {safeString(selectedClient.email || selectedClient.Email)}
                </Descriptions.Item>
                <Descriptions.Item label="Téléphone" span={1}>
                  {safeString(selectedClient.telephone || selectedClient.Tel)}
                </Descriptions.Item>
                <Descriptions.Item label="Adresse" span={2}>
                  {safeString(selectedClient.adresse || selectedClient.Adresse)}
                </Descriptions.Item>
                <Descriptions.Item label="Code postal" span={1}>
                  {safeString(selectedClient.codePostal)}
                </Descriptions.Item>
                <Descriptions.Item label="Solde" span={2}>
                  <span style={{ 
                    color: Number(selectedClient.solde || 0) > 0 ? "#ff4d4f" : "#52c41a", 
                    fontWeight: "bold", 
                    fontSize: 16 
                  }}>
                    {Number(selectedClient.solde || 0).toLocaleString()} DA
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
              {detailsLoading ? (
                <div style={{ textAlign: "center", padding: 16 }}>
                  <Spin />
                </div>
              ) : (
                <Table 
                  dataSource={Array.isArray(expeditions) ? expeditions : []} 
                  columns={[
                    { title: "Code", dataIndex: "code", key: "code" },
                    { title: "Destination", dataIndex: "destination", key: "destination" },
                    { title: "Date", dataIndex: "date", key: "date" },
                    { 
                      title: "Statut", 
                      dataIndex: "statut", 
                      key: "statut", 
                      render: (statut) => (
                        <Tag color={safeString(statut) === "livrée" ? "green" : "orange"}>
                          {safeString(statut).toUpperCase()}
                        </Tag>
                      )
                    },
                    { 
                      title: "Montant", 
                      dataIndex: "montant", 
                      key: "montant", 
                      render: (montant) => `${Number(montant || 0).toLocaleString()} DA` 
                    },
                  ]} 
                  pagination={{ pageSize: 5 }} 
                  size="small" 
                  rowKey={(r) => r.id ?? r.code ?? JSON.stringify(r)} 
                  locale={{ emptyText: "Aucune expédition pour ce client" }} 
                />
              )}
            </TabPane>

            <TabPane tab="Historique des factures" key="3">
              {detailsLoading ? (
                <div style={{ textAlign: "center", padding: 16 }}>
                  <Spin />
                </div>
              ) : (
                <Table 
                  dataSource={Array.isArray(factures) ? factures : []} 
                  columns={[
                    { title: "N° Facture", dataIndex: "numeroFacture", key: "numeroFacture" },
                    { title: "Date", dataIndex: "date", key: "date" },
                    { 
                      title: "Montant TTC", 
                      dataIndex: "montantTTC", 
                      key: "montantTTC", 
                      render: (montant) => `${Number(montant || 0).toLocaleString()} DA` 
                    },
                    { 
                      title: "Statut", 
                      dataIndex: "statut", 
                      key: "statut", 
                      render: (statut) => { 
                        const color = safeString(statut) === "payée" 
                          ? "green" 
                          : safeString(statut) === "partiellement payée" 
                            ? "orange" 
                            : "red"; 
                        return <Tag color={color}>{safeString(statut).toUpperCase()}</Tag>; 
                      } 
                    },
                  ]} 
                  pagination={{ pageSize: 5 }} 
                  size="small" 
                  rowKey={(r) => r.id ?? r.numeroFacture ?? JSON.stringify(r)} 
                  locale={{ emptyText: "Aucune facture pour ce client" }} 
                />
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default client;