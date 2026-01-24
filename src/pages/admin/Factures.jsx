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
  InputNumber,
  Select,
  DatePicker,
  Descriptions,
  message,
  Popconfirm,
  Switch,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  DollarOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { FactureContext } from "../../context/FactureContext";
import dayjs from "dayjs";

const Factures = () => {
  const {
    factures,
    clients,
    fetchFactures,
    fetchClients,
    ajouterPaiement,
    supprimerFacture,
    creerFacture,
  } = useContext(FactureContext);

  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [paiementVisible, setPaiementVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  useEffect(() => {
    fetchFactures();
    // charger la liste des clients pour le formulaire de création
    if (fetchClients) fetchClients();
  }, [fetchFactures, fetchClients]);

  const filteredFactures = factures.filter(
    (facture) =>
      facture.code_facture?.toLowerCase().includes(searchText.toLowerCase()) ||
      facture.clientNom?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleVoirDetails = (facture) => {
    setSelectedFacture(facture);
    setDetailsVisible(true);
  };

  const handleAjouterPaiement = (facture) => {
    setSelectedFacture(facture);
    setPaiementVisible(true);
    form.resetFields();
  };

  const handlePaiementSubmit = async (values) => {
    const paiement = {
      datePaiement: values.datePaiement.format("YYYY-MM-DD"),
      montant: values.montant,
      modePaiement: values.modePaiement,
      reference: values.reference,
      remarques: values.remarques || ""
    };

    try {
      await ajouterPaiement(selectedFacture.code_facture, paiement);
      message.success("Paiement enregistré avec succès");
      setPaiementVisible(false);
      form.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de l'enregistrement du paiement");
    }
  };

  const handleSupprimerFacture = async (factureId) => {
    try {
      await supprimerFacture(factureId);
      message.success("Facture supprimée avec succès");
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la suppression");
    }
  };

  const handleImprimerFacture = (facture) => {
    message.info(`Impression de la facture ${facture.code_facture}`);
    // Logique d'impression/PDF à implémenter
  };

  const getStatutTag = (facture) => {
    if (facture.est_payee) {
      return <Tag color="green">PAYÉE</Tag>;
    } else if (facture.montantPaye > 0) {
      return <Tag color="orange">PARTIELLEMENT PAYÉE</Tag>;
    } else {
      return <Tag color="red">IMPAYÉE</Tag>;
    }
  };

  const handleOpenCreate = () => {
    setCreateVisible(true);
    createForm.resetFields();
  };

const handleCreateSubmit = async (values) => {
  // construire l'objet attendu par le contexte
  const factureData = {
    // Ne pas envoyer code_facture, laissez le backend le générer
    code_client_id: values.code_client, // ID du client sélectionné
    date_f: values.date_f ? values.date_f.format("YYYY-MM-DD") : null,
    ht: values.ht || 0,
    tva: values.tva || 0,
    ttc: values.ttc ?? ((values.ht || 0) + (values.tva || 0)),
    // Ne pas envoyer date_creation
    remarques: values.remarques || "",
    est_payee: values.est_payee || false,
  };

  try {
    await creerFacture(factureData);
    message.success("Facture créée avec succès");
    setCreateVisible(false);
    createForm.resetFields();
  } catch (err) {
    console.error("Erreur détaillée:", err);
    // Afficher plus de détails sur l'erreur
    const errorMsg = err.response?.data?.detail || 
                     err.response?.data?.error || 
                     "Erreur lors de la création de la facture";
    message.error(errorMsg);
    
    // Pour le debug, afficher l'erreur complète dans la console
    if (err.response?.data?.traceback) {
      console.error("Traceback serveur:", err.response.data.traceback);
    }
  }
};

  const columns = [
    {
      title: "Code Facture",
      dataIndex: "code_facture",
      key: "code_facture",
      width: 150,
      sorter: (a, b) => (a.code_facture || "").localeCompare(b.code_facture || ""),
    },
    {
      title: "Client",
      key: "client",
      width: 200,
      render: (_, record) => {
        const nom = record.clientNom || "";
        const prenom = record.clientPrenom || "";
        return prenom ? `${nom} ${prenom}` : nom;
      },
    },
    {
      title: "Date Facture",
      dataIndex: "date_f",
      key: "date_f",
      width: 120,
      sorter: (a, b) => new Date(a.date_f) - new Date(b.date_f),
    },
    {
      title: "Date Création",
      dataIndex: "date_creation",
      key: "date_creation",
      width: 120,
      sorter: (a, b) => new Date(a.date_creation) - new Date(b.date_creation),
    },
    {
      title: "Montant HT",
      dataIndex: "ht",
      key: "ht",
      width: 120,
      render: (montant) => `${(montant || 0).toLocaleString()} DA`,
    },
    {
      title: "TVA",
      dataIndex: "tva",
      key: "tva",
      width: 120,
      render: (montant) => `${(montant || 0).toLocaleString()} DA`,
    },
    {
      title: "Montant TTC",
      dataIndex: "ttc",
      key: "ttc",
      width: 130,
      render: (montant) => (
        <strong style={{ color: "#1890ff" }}>
          {(montant || 0).toLocaleString()} DA
        </strong>
      ),
      sorter: (a, b) => (a.ttc || 0) - (b.ttc || 0),
    },
    {
      title: "Payé",
      dataIndex: "montantPaye",
      key: "montantPaye",
      width: 120,
      render: (montant) => (
        <span style={{ color: "#52c41a" }}>
          {(montant || 0).toLocaleString()} DA
        </span>
      ),
    },
    {
      title: "Restant",
      dataIndex: "montantRestant",
      key: "montantRestant",
      width: 120,
      render: (montant) => (
        <span style={{ color: montant > 0 ? "#ff4d4f" : "#52c41a" }}>
          {(montant || 0).toLocaleString()} DA
        </span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 150,
      render: (_, record) => getStatutTag(record),
      filters: [
        { text: "Payée", value: "payee" },
        { text: "Partiellement payée", value: "partielle" },
        { text: "Impayée", value: "impayee" },
      ],
      onFilter: (value, record) => {
        if (value === "payee") return record.est_payee;
        if (value === "partielle") return !record.est_payee && record.montantPaye > 0;
        if (value === "impayee") return !record.est_payee && record.montantPaye === 0;
        return false;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      // fixed: "right",
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
            icon={<FilePdfOutlined />}
            onClick={() => handleImprimerFacture(record)}
            size="small"
          >
            PDF
          </Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette facture ?"
            onConfirm={() => handleSupprimerFacture(record.id)}
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
    <div style={{ width: "85vw", height: "100%" }}>
      <Card title="Gestion des Factures" bordered={false} style={{ width: "100%" }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Rechercher par code facture ou client"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 400 }}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Ajouter une facture
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredFactures}
            rowKey="code_facture"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} factures`,
            }}
            scroll={{ x: 1600 }}
            bordered
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchText
                      ? `Aucune facture trouvée pour "${searchText}"`
                      : "Aucune facture disponible"
                  }
                />
              ),
            }}
            summary={(pageData) => {
              let totalHT = 0;
              let totalTVA = 0;
              let totalTTC = 0;
              let totalPaye = 0;
              let totalRestant = 0;

              pageData.forEach(({ ht, tva, ttc, montantPaye, montantRestant }) => {
                totalHT += ht || 0;
                totalTVA += tva || 0;
                totalTTC += ttc || 0;
                totalPaye += montantPaye || 0;
                totalRestant += montantRestant || 0;
              });

              return (
                <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <strong>Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <strong>{totalHT.toLocaleString()} DA</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <strong>{totalTVA.toLocaleString()} DA</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <strong style={{ color: "#1890ff" }}>
                      {totalTTC.toLocaleString()} DA
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <strong style={{ color: "#52c41a" }}>
                      {totalPaye.toLocaleString()} DA
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    <strong style={{ color: "#ff4d4f" }}>
                      {totalRestant.toLocaleString()} DA
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} colSpan={2} />
                </Table.Summary.Row>
              );
            }}
          />
        </Space>
      </Card>

      {/* Modal Détails Facture */}
      <Modal
        title={`Détails de la facture ${selectedFacture?.code_facture}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => handleImprimerFacture(selectedFacture)}
          >
            Imprimer PDF
          </Button>,
        ]}
        width={800}
      >
        {selectedFacture && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code Facture" span={1}>
                {selectedFacture.code_facture}
              </Descriptions.Item>
              <Descriptions.Item label="Client" span={1}>
                {selectedFacture.clientNom} {selectedFacture.clientPrenom}
              </Descriptions.Item>
              <Descriptions.Item label="Date Facture" span={1}>
                {selectedFacture.date_f}
              </Descriptions.Item>
              <Descriptions.Item label="Date Création" span={1}>
                {selectedFacture.date_creation}
              </Descriptions.Item>
              <Descriptions.Item label="Code Client" span={2}>
                {selectedFacture.code_client_id}
              </Descriptions.Item>
              <Descriptions.Item label="Montant HT" span={1}>
                {(selectedFacture.ht || 0).toLocaleString()} DA
              </Descriptions.Item>
              <Descriptions.Item label="TVA" span={1}>
                {(selectedFacture.tva || 0).toLocaleString()} DA
              </Descriptions.Item>
              <Descriptions.Item label="Montant TTC" span={2}>
                <strong style={{ fontSize: 16, color: "#1890ff" }}>
                  {(selectedFacture.ttc || 0).toLocaleString()} DA
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Remarques" span={2}>
                {selectedFacture.remarques || "Aucune remarque"}
              </Descriptions.Item>
              <Descriptions.Item label="Statut" span={2}>
                {getStatutTag(selectedFacture)}
              </Descriptions.Item>
            </Descriptions>

            {selectedFacture.paiements && selectedFacture.paiements.length > 0 && (
              <Card
                title="Historique des paiements"
                size="small"
                style={{ marginTop: 16 }}
              >
                <Table
                  dataSource={selectedFacture.paiements}
                  columns={[
                    { title: "Date", dataIndex: "date_paiement", key: "date_paiement" },
                    {
                      title: "Montant",
                      dataIndex: "montant",
                      key: "montant",
                      render: (montant) => `${(montant || 0).toLocaleString()} DA`,
                    },
                    { title: "Mode", dataIndex: "mode_paiement", key: "mode_paiement" },
                    { title: "Référence", dataIndex: "reference", key: "reference" },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="id"
                />
              </Card>
            )}
          </>
        )}
      </Modal>

      {/* Modal Ajouter Paiement */}
      <Modal
        title={`Enregistrer un paiement - ${selectedFacture?.code_facture}`}
        open={paiementVisible}
        onCancel={() => {
          setPaiementVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        {selectedFacture && (
          <>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Montant TTC">
                {(selectedFacture.ttc || 0).toLocaleString()} DA
              </Descriptions.Item>
              <Descriptions.Item label="Déjà payé">
                {(selectedFacture.montantPaye || 0).toLocaleString()} DA
              </Descriptions.Item>
              <Descriptions.Item label="Restant à payer">
                <strong style={{ color: "#ff4d4f" }}>
                  {(selectedFacture.montantRestant || 0).toLocaleString()} DA
                </strong>
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={handlePaiementSubmit} initialValues={{
                datePaiement: dayjs(),
                montant: selectedFacture.montantRestant,
              }}>
              <Form.Item
                name="montant"
                label="Montant du paiement"
                rules={[
                  { required: true, message: "Veuillez saisir le montant" },
                 {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (value > selectedFacture.montantRestant) {
                        return Promise.reject(
                          new Error(`Le montant ne peut pas dépasser ${selectedFacture.montantRestant} DA`)
                        );
                      }
                      if (value <= 0) {
                        return Promise.reject(new Error("Le montant doit être supérieur à 0"));
                      }
                      return Promise.resolve();
                    }
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={selectedFacture.montantRestant}
                  step={100}
                  precision={2}
                  placeholder="Montant en DA"
                  
                />
              </Form.Item>

              <Form.Item
                name="modePaiement"
                label="Mode de paiement"
                rules={[{ required: true, message: "Veuillez sélectionner un mode" }]}
              >
                <Select placeholder="Sélectionner un mode">
                  <Select.Option value="Espèces">Espèces</Select.Option>
                  <Select.Option value="Chèque">Chèque</Select.Option>
                  <Select.Option value="Virement">Virement</Select.Option>
                  <Select.Option value="Carte bancaire">Carte bancaire</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="reference"
                label="Référence"
                rules={[{ required: true, message: "Veuillez saisir une référence" }]}
              >
                <Input placeholder="Ex: PAY-005" />
              </Form.Item>

              <Form.Item
                name="datePaiement"
                label="Date de paiement"
                rules={[{ required: true, message: "Veuillez sélectionner une date" }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Modal Création Facture */}
      <Modal
        title="Créer une nouvelle facture"
        open={createVisible}
        onCancel={() => {
          setCreateVisible(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
          <Form.Item
  name="code_client"
  label="Client"
  rules={[{ required: true, message: "Veuillez sélectionner un client" }]}
>
  <Select
    showSearch
    placeholder="Sélectionner un client"
    optionFilterProp="children"
    filterOption={(input, option) =>
      String(option.children).toLowerCase().includes(String(input).toLowerCase())
    }
    allowClear
  >
    {(clients || []).map((c) => (
      <Select.Option key={c.id} value={c.id}>
        {`${c.nom || "—"}${c.prenom ? " " + c.prenom : ""}`}
      </Select.Option>
    ))}
  </Select>
</Form.Item>

          <Form.Item name="date_f" label="Date facture" initialValue={dayjs()}>
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="ht" label="Montant HT">
            <InputNumber style={{ width: "100%" }} min={0} formatter={(v) => `${v}`} />
          </Form.Item>

          <Form.Item name="tva" label="TVA">
            <InputNumber style={{ width: "100%" }} min={0} formatter={(v) => `${v}`} />
          </Form.Item>

          <Form.Item name="ttc" label="Montant TTC" help="Laisser vide pour calcul automatique (HT + TVA)">
            <InputNumber style={{ width: "100%" }} min={0} formatter={(v) => `${v}`} />
          </Form.Item>

          <Form.Item name="remarques" label="Remarques">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="est_payee" label="Déjà payée" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Factures;