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
  InputNumber,
  message,
  Popconfirm,
  Spin,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { ExpeditionContext } from "../../context/ExpeditionContext";
import { ClientContext } from "../../context/clientContext";

const { TextArea } = Input;

const Expeditions = () => {
  const {
    expeditions,
    fetchExpeditions,
    ajouterExpedition,
    modifierExpedition,
    supprimerExpedition,
    validerExpedition, // CHANGÉ : on utilise validerExpedition
    loading,
  } = useContext(ExpeditionContext);

  const { clients, fetchClients } = useContext(ClientContext);

  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchExpeditions();
    fetchClients();
  }, [fetchExpeditions, fetchClients]);

  const safeString = (v) => (v === null || v === undefined ? "" : String(v));

  const filteredExpeditions =
    Array.isArray(expeditions) && expeditions.length
      ? expeditions.filter((exp) => {
          const q = safeString(searchText).toLowerCase();
          const code = safeString(exp.code).toLowerCase();
          const client = safeString(exp.client).toLowerCase();
          const description = safeString(exp.description).toLowerCase();

          return (
            code.includes(q) ||
            client.includes(q) ||
            description.includes(q)
          );
        })
      : [];

  const handleAjouterExpedition = () => {
    setIsEditing(false);
    setSelectedExpedition(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModifierExpedition = (expedition) => {
    if (expedition.peutEtreModifie === false) {
      message.warning("Cette expédition ne peut plus être modifiée (statut avancé)");
      return;
    }

    setIsEditing(true);
    setSelectedExpedition(expedition);
    
    console.log("📝 Expédition complète à modifier:", expedition);
    console.log("📝 ClientId de l'expédition:", expedition.clientId, "Type:", typeof expedition.clientId);
    console.log("📝 CodeClient de l'expédition:", expedition.codeClient, "Type:", typeof expedition.codeClient);
    
    // S'assurer que les valeurs sont bien des nombres
    const clientIdValue = expedition.clientId || expedition.codeClient;
    
    const formValues = {
      clientId: clientIdValue,
      poids: Number(expedition.poids) || 0.01,
      volume: Number(expedition.volume) || 0.01,
      statut: expedition.statut || 'EN_ATTENTE',
      tarification: expedition.tarification || undefined,
      description: expedition.description || '',
    };
    
    console.log("📝 Valeurs qui vont être mises dans le formulaire:", formValues);
    console.log("📝 ClientId final:", formValues.clientId, "Type:", typeof formValues.clientId);
    
    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  const handleModalSubmit = async (values) => {
    try {
      console.log("========== DÉBUT SOUMISSION FORMULAIRE ==========");
      console.table(values);
      console.log("📝 Type de poids:", typeof values.poids, "Valeur:", values.poids);
      console.log("📝 Type de volume:", typeof values.volume, "Valeur:", values.volume);
      console.log("📝 Type de clientId:", typeof values.clientId, "Valeur:", values.clientId);
      console.log("📝 Type de statut:", typeof values.statut, "Valeur:", values.statut);
      
      // S'assurer que tous les champs sont du bon type
      const payload = {
        clientId: Number(values.clientId),
        poids: Number(values.poids),
        volume: Number(values.volume),
        statut: values.statut || 'EN_ATTENTE',
        tarification: values.tarification ? Number(values.tarification) : null,
        description: values.description || '',
      };
      
      // Vérifier que poids et volume sont valides
      if (isNaN(payload.poids) || payload.poids <= 0) {
        message.error("Le poids doit être un nombre positif");
        return;
      }
      
      if (isNaN(payload.volume) || payload.volume <= 0) {
        message.error("Le volume doit être un nombre positif");
        return;
      }
      
      if (isNaN(payload.clientId) || payload.clientId <= 0) {
        message.error("Le client est invalide");
        return;
      }
      
      console.log("📤 PAYLOAD APRÈS NETTOYAGE:");
      console.table(payload);
      
      if (isEditing) {
        console.log("🔧 MODE ÉDITION - ID:", selectedExpedition.id);
        await modifierExpedition(selectedExpedition.id, payload);
        message.success("Expédition modifiée avec succès");
      } else {
        console.log("➕ MODE CRÉATION");
        await ajouterExpedition(payload);
        message.success("Expédition ajoutée avec succès");
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("========== ERREUR SOUMISSION ==========");
      console.error("❌ Erreur complète:", error);
      console.error("❌ Message:", error.message);
      console.error("❌ Response:", error.response);
      if (error.response?.data) {
        console.error("❌ Data du backend:");
        console.log(JSON.stringify(error.response.data, null, 2));
      }
      const errMsg = error.message || "Une erreur s'est produite";
      message.error(errMsg, 5);
    }
  };

  const handleSupprimerExpedition = async (record) => {
    if (record.peutEtreSupprime === false) {
      message.warning("Cette expédition ne peut pas être supprimée (déjà facturée)");
      return;
    }

    try {
      await supprimerExpedition(record);
      message.success("Expédition supprimée avec succès");
    } catch (error) {
      console.error("Erreur suppression:", error);
      message.error(error.message || "Une erreur s'est produite lors de la suppression");
    }
  };

  // CORRECTION ICI : Utiliser validerExpedition au lieu de updateStatut
  const handleValiderExpedition = async (record) => {
    const hide = message.loading("Validation en cours...", 0);
    try {
      await validerExpedition(record.id);
      hide();
      message.success("Expédition marquée comme livrée");
    } catch (error) {
      hide();
      console.error("Erreur validation:", error);
      message.error(error.response?.data?.error || "Erreur lors de la validation");
    }
  };

  const getStatutColor = (statut) => {
    const statutUpper = safeString(statut).toUpperCase();
    switch (statutUpper) {
      case "LIVREE":
      case "LIVRÉE":
        return "green";
      case "EN_TRANSIT":
        return "blue";
      case "EN_ATTENTE":
        return "orange";
      case "ANNULEE":
      case "ANNULÉE":
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
      width: 150,
      sorter: (a, b) => safeString(a.code).localeCompare(safeString(b.code)),
      fixed: "left",
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 200,
      render: (_, record) => {
    if (record.client && typeof record.client === 'object') {
      return `${record.client.nom || ''} ${record.client.prenom || ''}`.trim() || 'Client inconnu';
    }
    // Si c'est déjà un string
    return record.client || 'Client inconnu';
  },
},
    {
      title: "Poids (kg)",
      dataIndex: "poids",
      key: "poids",
      width: 120,
      render: (poids) => Number(poids || 0).toFixed(2),
      sorter: (a, b) => (Number(a.poids) || 0) - (Number(b.poids) || 0),
    },
    {
      title: "Volume (m³)",
      dataIndex: "volume",
      key: "volume",
      width: 120,
      render: (volume) => Number(volume || 0).toFixed(2),
      sorter: (a, b) => (Number(a.volume) || 0) - (Number(b.volume) || 0),
    },
    {
      title: "Montant estimé",
      dataIndex: "montantEstime",
      key: "montantEstime",
      width: 150,
      render: (montant) => montant ? `${Number(montant).toLocaleString()} DA` : '-',
    },
    {
      title: "Date",
      dataIndex: "dateCreation",
      key: "dateCreation",
      width: 150,
      render: (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
      sorter: (a, b) => new Date(a.dateCreation || 0) - new Date(b.dateCreation || 0),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 140,
      render: (statut, record) => (
        <Space>
          <Tag color={getStatutColor(statut)}>
            {safeString(record.statutDisplay || statut).toUpperCase()}
          </Tag>
          {record.nbIncidents > 0 && (
            <Tooltip title={`${record.nbIncidents} incident(s)`}>
              <InfoCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      ),
      filters: [
        { text: "En attente", value: "EN_ATTENTE" },
        { text: "En transit", value: "EN_TRANSIT" },
        { text: "Livrée", value: "LIVREE" },
        { text: "Annulée", value: "ANNULEE" },
      ],
      onFilter: (value, record) => record.statut === value,
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      // fixed: "right",
      render: (_, record) => {
        const estLivree = record.statut === "LIVREE" || record.statut === "LIVRÉE";
        const peutValider = record.statut === "EN_ATTENTE" || record.statut === "EN_TRANSIT";
        
        return (
          
          <Space  size="small">
            <Tooltip title={!peutValider && !estLivree ? "Statut non validable" : ""}>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleValiderExpedition(record)}
                disabled={!peutValider}
                size="small"
              >
                {estLivree ? "✓ Livrée" : "Valider"}
              </Button>
            </Tooltip>
            
            <Tooltip title={record.peutEtreModifie === false ? "Ne peut plus être modifiée" : ""}>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleModifierExpedition(record)}
                disabled={record.peutEtreModifie === false}
                size="small"
              >
                Modifier
              </Button>
            </Tooltip>
            
            <Tooltip title={record.peutEtreSupprime === false ? "Déjà facturée" : ""}>
              <Popconfirm
                title="Êtes-vous sûr de vouloir supprimer cette expédition ?"
                description="Cette action est irréversible."
                onConfirm={() => handleSupprimerExpedition(record)}
                okText="Oui"
                cancelText="Non"
                disabled={record.peutEtreSupprime === false}
              >
                <Button 
                  type="link" 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                  disabled={record.peutEtreSupprime === false}
                >
                  Supprimer
                </Button>
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const rowKeyFn = (record) => record.id ?? record.code ?? JSON.stringify(record);

  return (
    <div style={{ 
      width: "85vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      padding: "20px" 
    }}>
      <Card
        title="Gestion des Expéditions"
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
            placeholder="Rechercher par code, client ou description"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAjouterExpedition}
            style={{ marginLeft: "auto" }}
          >
            Ajouter une expédition
          </Button>
        </Space>

        <div style={{ flex: 1, minHeight: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredExpeditions}
              rowKey={rowKeyFn}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Total: ${total} expéditions`,
              }}
              scroll={{ x: 1800, y: "100%" }}
              bordered
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      searchText
                        ? `Aucune expédition trouvée pour "${searchText}"`
                        : "Aucune expédition disponible"
                    }
                  />
                ),
              }}
            />
          )}
        </div>
      </Card>

      {/* Modal Ajouter/Modifier */}
      <Modal
        title={isEditing ? "Modifier une expédition" : "Ajouter une expédition"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={isEditing ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item
            name="clientId"
            label="Client"
            rules={[{ required: true, message: "Veuillez sélectionner un client" }]}
          >
            <Select
              placeholder="Sélectionner un client"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={clients.map((client) => ({
                value: client.id,
                label: `${client.nom || ''} ${client.prenom || ''}`.trim() || client.email,
              }))}
            />
          </Form.Item>

          <Space style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
            <Form.Item
              name="poids"
              label="Poids (kg)"
              rules={[
                { required: true, message: "Veuillez saisir le poids" },
                { 
                  type: 'number', 
                  min: 0.01, 
                  message: "Le poids doit être supérieur à 0" 
                }
              ]}
              style={{ width: "48%" }}
            >
              <InputNumber 
                min={0.01} 
                step={0.01} 
                style={{ width: "100%" }} 
                placeholder="0.00"
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="volume"
              label="Volume (m³)"
              rules={[
                { required: true, message: "Veuillez saisir le volume" },
                { 
                  type: 'number', 
                  min: 0.01, 
                  message: "Le volume doit être supérieur à 0" 
                }
              ]}
              style={{ width: "48%" }}
            >
              <InputNumber 
                min={0.01} 
                step={0.01} 
                style={{ width: "100%" }} 
                placeholder="0.00"
                precision={2}
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="statut"
            label="Statut"
            rules={[{ required: true, message: "Veuillez sélectionner le statut" }]}
            initialValue="EN_ATTENTE"
          >
            <Select>
              <Select.Option value="EN_ATTENTE">En attente</Select.Option>
              <Select.Option value="EN_TRANSIT">En transit</Select.Option>
              {/* Retiré l'option LIVREE pour la création - utiliser le bouton Valider à la place */}
              {isEditing && <Select.Option value="LIVREE">Livrée</Select.Option>}
              <Select.Option value="ANNULEE">Annulée</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tarification"
            label="Tarification (optionnel)"
          >
            <Select
              placeholder="Sélectionner une tarification"
              allowClear
            >
              {/* Vous devrez récupérer la liste des tarifications */}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Description de l'expédition..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Expeditions;