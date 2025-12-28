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
  DatePicker,
  message,
  Popconfirm,
  Descriptions,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  FilePdfOutlined,
  EyeOutlined,
  StopOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { PaiementContext } from "../../context/PaiementContext";
import { FactureContext } from "../../context/FactureContext";
import dayjs from "dayjs";

const { TextArea } = Input;

const Paiements = () => {
  const { paiements, statistiques, fetchPaiements, ajouterPaiement, annulerPaiement } =
    useContext(PaiementContext);
  const { factures, fetchFactures } = useContext(FactureContext);

  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [ajouterVisible, setAjouterVisible] = useState(false);
  const [annulerVisible, setAnnulerVisible] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [form] = Form.useForm();
  const [annulerForm] = Form.useForm();

  useEffect(() => {
    fetchPaiements();
    fetchFactures();
  }, [fetchPaiements, fetchFactures]);

  const filteredPaiements = paiements.filter(
    (paiement) =>
      paiement.reference.toLowerCase().includes(searchText.toLowerCase()) ||
      paiement.numeroFacture.toLowerCase().includes(searchText.toLowerCase()) ||
      paiement.clientNom.toLowerCase().includes(searchText.toLowerCase()) ||
      paiement.modePaiement.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleVoirDetails = (paiement) => {
    setSelectedPaiement(paiement);
    setDetailsVisible(true);
  };

  const handleAjouterPaiement = () => {
    form.resetFields();
    setAjouterVisible(true);
  };

  const handleAjouterSubmit = async (values) => {
    const facture = factures.find((f) => f.id === values.factureId);
    const paiement = {
      factureId: values.factureId,
      numeroFacture: facture.numeroFacture,
      clientId: facture.clientId,
      clientNom: facture.clientNom,
      datePaiement: values.datePaiement.format("YYYY-MM-DD"),
      montant: values.montant,
      modePaiement: values.modePaiement,
      commentaire: values.commentaire || "",
    };

    await ajouterPaiement(paiement);
    message.success("Paiement enregistré avec succès");
    setAjouterVisible(false);
    form.resetFields();
  };

  const handleAnnulerPaiement = (paiement) => {
    setSelectedPaiement(paiement);
    annulerForm.resetFields();
    setAnnulerVisible(true);
  };

  const handleAnnulerSubmit = async (values) => {
    await annulerPaiement(selectedPaiement.id, values.motif);
    message.success("Paiement annulé avec succès");
    setAnnulerVisible(false);
    annulerForm.resetFields();
  };

  const handleImprimerRecu = (paiement) => {
    message.info(`Impression du reçu ${paiement.reference}`);
    // Logique d'impression/PDF à implémenter
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case "validé":
        return "green";
      case "en attente":
        return "orange";
      case "annulé":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      width: 150,
      sorter: (a, b) => a.reference.localeCompare(b.reference),
      fixed: "left",
    },
    {
      title: "Date",
      dataIndex: "datePaiement",
      key: "datePaiement",
      width: 120,
      sorter: (a, b) => new Date(a.datePaiement) - new Date(b.datePaiement),
    },
    {
      title: "Facture",
      dataIndex: "numeroFacture",
      key: "numeroFacture",
      width: 150,
    },
    {
      title: "Client",
      dataIndex: "clientNom",
      key: "clientNom",
      width: 200,
    },
    {
      title: "Montant",
      dataIndex: "montant",
      key: "montant",
      width: 130,
      sorter: (a, b) => a.montant - b.montant,
      render: (montant) => (
        <strong style={{ color: "#52c41a", fontSize: 14 }}>
          {montant.toLocaleString()} DA
        </strong>
      ),
    },
    {
      title: "Mode",
      dataIndex: "modePaiement",
      key: "modePaiement",
      width: 150,
      filters: [
        { text: "Espèces", value: "Espèces" },
        { text: "Chèque", value: "Chèque" },
        { text: "Virement", value: "Virement" },
        { text: "Carte bancaire", value: "Carte bancaire" },
      ],
      onFilter: (value, record) => record.modePaiement === value,
      render: (mode) => {
        const colors = {
          Espèces: "gold",
          Chèque: "blue",
          Virement: "cyan",
          "Carte bancaire": "purple",
        };
        return <Tag color={colors[mode]}>{mode}</Tag>;
      },
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 120,
      filters: [
        { text: "Validé", value: "validé" },
        { text: "En attente", value: "en attente" },
        { text: "Annulé", value: "annulé" },
      ],
      onFilter: (value, record) => record.statut === value,
      render: (statut) => (
        <Tag color={getStatutColor(statut)}>{statut.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Agent",
      dataIndex: "agentNom",
      key: "agentNom",
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
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
            icon={<FilePdfOutlined />}
            onClick={() => handleImprimerRecu(record)}
            size="small"
          >
            Reçu
          </Button>
          {record.statut === "validé" && (
            <Popconfirm
              title="Êtes-vous sûr de vouloir annuler ce paiement ?"
              onConfirm={() => handleAnnulerPaiement(record)}
              okText="Oui"
              cancelText="Non"
            >
              <Button type="link" danger icon={<StopOutlined />} size="small">
                Annuler
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Factures avec montant restant > 0
  const facturesImpayees = factures.filter((f) => f.montantRestant > 0);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Card title="Journal des Paiements" bordered={false} style={{ width: "100%" }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* Statistiques */}
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total des paiements"
                  value={statistiques.totalPaiements}
                  suffix="DA"
                  valueStyle={{ color: "#3f8600" }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Nombre de paiements"
                  value={statistiques.nombrePaiements}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Paiements validés"
                  value={statistiques.parStatut.validé.nombre}
                  suffix={`/ ${statistiques.nombrePaiements}`}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="En attente"
                  value={statistiques.parStatut["en attente"].montant}
                  suffix="DA"
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Barre de recherche et actions */}
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Input
              placeholder="Rechercher par référence, facture, client ou mode"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 500 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAjouterPaiement}
            >
              Enregistrer un paiement
            </Button>
          </Space>

          {/* Tableau des paiements */}
          <Table
            columns={columns}
            dataSource={filteredPaiements}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} paiements`,
            }}
            scroll={{ x: 1600 }}
            bordered
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchText
                      ? `Aucun paiement trouvé pour "${searchText}"`
                      : "Aucun paiement enregistré"
                  }
                />
              ),
            }}
            summary={(pageData) => {
              let totalMontant = 0;
              pageData.forEach(({ montant, statut }) => {
                if (statut === "validé") totalMontant += montant;
              });

              return (
                <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <strong>Total des paiements affichés (validés)</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <strong style={{ color: "#52c41a", fontSize: 14 }}>
                      {totalMontant.toLocaleString()} DA
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} colSpan={4} />
                </Table.Summary.Row>
              );
            }}
          />
        </Space>
      </Card>

      {/* Modal Détails Paiement */}
      <Modal
        title={`Détails du paiement ${selectedPaiement?.reference}`}
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
            onClick={() => handleImprimerRecu(selectedPaiement)}
          >
            Imprimer le reçu
          </Button>,
        ]}
        width={700}
      >
        {selectedPaiement && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Référence" span={1}>
              {selectedPaiement.reference}
            </Descriptions.Item>
            <Descriptions.Item label="Statut" span={1}>
              <Tag color={getStatutColor(selectedPaiement.statut)}>
                {selectedPaiement.statut.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date de paiement" span={2}>
              {selectedPaiement.datePaiement}
            </Descriptions.Item>
            <Descriptions.Item label="Facture" span={1}>
              {selectedPaiement.numeroFacture}
            </Descriptions.Item>
            <Descriptions.Item label="Client" span={1}>
              {selectedPaiement.clientNom}
            </Descriptions.Item>
            <Descriptions.Item label="Montant" span={2}>
              <strong style={{ fontSize: 18, color: "#52c41a" }}>
                {selectedPaiement.montant.toLocaleString()} DA
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Mode de paiement" span={2}>
              <Tag
                color={
                  {
                    Espèces: "gold",
                    Chèque: "blue",
                    Virement: "cyan",
                    "Carte bancaire": "purple",
                  }[selectedPaiement.modePaiement]
                }
              >
                {selectedPaiement.modePaiement}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Agent" span={2}>
              {selectedPaiement.agentNom}
            </Descriptions.Item>
            {selectedPaiement.commentaire && (
              <Descriptions.Item label="Commentaire" span={2}>
                {selectedPaiement.commentaire}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Modal Ajouter Paiement */}
      <Modal
        title="Enregistrer un nouveau paiement"
        open={ajouterVisible}
        onCancel={() => {
          setAjouterVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleAjouterSubmit}>
          <Form.Item
            name="factureId"
            label="Facture"
            rules={[{ required: true, message: "Veuillez sélectionner une facture" }]}
          >
            <Select
              placeholder="Sélectionner une facture impayée"
              showSearch
              optionFilterProp="children"
              onChange={(value) => {
                const facture = factures.find((f) => f.id === value);
                form.setFieldsValue({ montant: facture.montantRestant });
              }}
            >
              {facturesImpayees.map((facture) => (
                <Select.Option key={facture.id} value={facture.id}>
                  {facture.numeroFacture} - {facture.clientNom} (Reste:{" "}
                  {facture.montantRestant.toLocaleString()} DA)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="montant"
            label="Montant du paiement"
            rules={[{ required: true, message: "Veuillez saisir le montant" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `${value} DA`}
              parser={(value) => value.replace(" DA", "")}
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
            name="datePaiement"
            label="Date de paiement"
            rules={[{ required: true, message: "Veuillez sélectionner une date" }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="commentaire" label="Commentaire">
            <TextArea rows={3} placeholder="Notes ou observations..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Annuler Paiement */}
      <Modal
        title={`Annuler le paiement ${selectedPaiement?.reference}`}
        open={annulerVisible}
        onCancel={() => {
          setAnnulerVisible(false);
          annulerForm.resetFields();
        }}
        onOk={() => annulerForm.submit()}
        okText="Confirmer l'annulation"
        cancelText="Retour"
        okButtonProps={{ danger: true }}
      >
        <Form form={annulerForm} layout="vertical" onFinish={handleAnnulerSubmit}>
          <Form.Item
            name="motif"
            label="Motif de l'annulation"
            rules={[{ required: true, message: "Veuillez saisir le motif" }]}
          >
            <TextArea
              rows={4}
              placeholder="Ex: Erreur de saisie, chèque impayé, demande du client..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Paiements;