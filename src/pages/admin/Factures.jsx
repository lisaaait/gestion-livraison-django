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
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  DollarOutlined,
  DeleteOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { FactureContext } from "../../context/FactureContext";
import dayjs from "dayjs";

const Factures = () => {
  const { factures, fetchFactures, ajouterPaiement, supprimerFacture } =
    useContext(FactureContext);
  const [searchText, setSearchText] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [paiementVisible, setPaiementVisible] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchFactures();
  }, [fetchFactures]);

  const filteredFactures = factures.filter(
    (facture) =>
      facture.numeroFacture.toLowerCase().includes(searchText.toLowerCase()) ||
      facture.clientNom.toLowerCase().includes(searchText.toLowerCase())
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
    };

    await ajouterPaiement(selectedFacture.id, paiement);
    message.success("Paiement enregistré avec succès");
    setPaiementVisible(false);
    form.resetFields();
  };

  const handleSupprimerFacture = async (factureId) => {
    await supprimerFacture(factureId);
    message.success("Facture supprimée avec succès");
  };

  const handleImprimerFacture = (facture) => {
    message.info(`Impression de la facture ${facture.numeroFacture}`);
    // Logique d'impression/PDF à implémenter
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case "payée":
        return "green";
      case "partiellement payée":
        return "orange";
      case "impayée":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "N° Facture",
      dataIndex: "numeroFacture",
      key: "numeroFacture",
      width: 150,
      sorter: (a, b) => a.numeroFacture.localeCompare(b.numeroFacture),
    },
    {
      title: "Client",
      dataIndex: "clientNom",
      key: "clientNom",
      width: 150,
    },
    {
      title: "Date",
      dataIndex: "dateFacture",
      key: "dateFacture",
      width: 120,
      sorter: (a, b) => new Date(a.dateFacture) - new Date(b.dateFacture),
    },
    {
      title: "Montant HT",
      dataIndex: "montantHT",
      key: "montantHT",
      width: 120,
      render: (montant) => `${montant.toLocaleString()} DA`,
    },
    {
      title: "TVA (19%)",
      dataIndex: "montantTVA",
      key: "montantTVA",
      width: 120,
      render: (montant) => `${montant.toLocaleString()} DA`,
    },
    {
      title: "Montant TTC",
      dataIndex: "montantTTC",
      key: "montantTTC",
      width: 130,
      render: (montant) => (
        <strong style={{ color: "#1890ff" }}>
          {montant.toLocaleString()} DA
        </strong>
      ),
      sorter: (a, b) => a.montantTTC - b.montantTTC,
    },
    {
      title: "Payé",
      dataIndex: "montantPaye",
      key: "montantPaye",
      width: 120,
      render: (montant) => (
        <span style={{ color: "#52c41a" }}>
          {montant.toLocaleString()} DA
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
          {montant.toLocaleString()} DA
        </span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 150,
      render: (statut) => (
        <Tag color={getStatutColor(statut)}>{statut.toUpperCase()}</Tag>
      ),
      filters: [
        { text: "Payée", value: "payée" },
        { text: "Partiellement payée", value: "partiellement payée" },
        { text: "Impayée", value: "impayée" },
      ],
      onFilter: (value, record) => record.statut === value,
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
          {record.montantRestant > 0 && (
            <Button
              type="link"
              icon={<DollarOutlined />}
              onClick={() => handleAjouterPaiement(record)}
              size="small"
            >
              Payer
            </Button>
          )}
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
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Card title="Gestion des Factures" bordered={false} style={{ width: "100%" }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Input
            placeholder="Rechercher par numéro de facture ou client"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400 }}
            allowClear
          />

          <Table
            columns={columns}
            dataSource={filteredFactures}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} factures`,
            }}
            scroll={{ x: 1500 }}
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

              pageData.forEach(({ montantHT, montantTVA, montantTTC, montantPaye, montantRestant }) => {
                totalHT += montantHT;
                totalTVA += montantTVA;
                totalTTC += montantTTC;
                totalPaye += montantPaye;
                totalRestant += montantRestant;
              });

              return (
                <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <strong>Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <strong>{totalHT.toLocaleString()} DA</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <strong>{totalTVA.toLocaleString()} DA</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <strong style={{ color: "#1890ff" }}>
                      {totalTTC.toLocaleString()} DA
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <strong style={{ color: "#52c41a" }}>
                      {totalPaye.toLocaleString()} DA
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <strong style={{ color: "#ff4d4f" }}>
                      {totalRestant.toLocaleString()} DA
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} colSpan={2} />
                </Table.Summary.Row>
              );
            }}
          />
        </Space>
      </Card>

      {/* Modal Détails Facture */}
      <Modal
        title={`Détails de la facture ${selectedFacture?.numeroFacture}`}
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
              <Descriptions.Item label="N° Facture" span={1}>
                {selectedFacture.numeroFacture}
              </Descriptions.Item>
              <Descriptions.Item label="Client" span={1}>
                {selectedFacture.clientNom}
              </Descriptions.Item>
              <Descriptions.Item label="Date" span={1}>
                {selectedFacture.dateFacture}
              </Descriptions.Item>
              <Descriptions.Item label="Échéance" span={1}>
                {selectedFacture.dateEcheance}
              </Descriptions.Item>
              <Descriptions.Item label="Montant HT" span={1}>
                {selectedFacture.montantHT.toLocaleString()} DA
              </Descriptions.Item>
              <Descriptions.Item label="TVA (19%)" span={1}>
                {selectedFacture.montantTVA.toLocaleString()} DA
              </Descriptions.Item>
              <Descriptions.Item label="Montant TTC" span={2}>
                <strong style={{ fontSize: 16, color: "#1890ff" }}>
                  {selectedFacture.montantTTC.toLocaleString()} DA
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Statut" span={2}>
                <Tag color={getStatutColor(selectedFacture.statut)}>
                  {selectedFacture.statut.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Card
              title="Expéditions facturées"
              size="small"
              style={{ marginTop: 16 }}
            >
              <Table
                dataSource={selectedFacture.expeditions}
                columns={[
                  { title: "Code", dataIndex: "code", key: "code" },
                  {
                    title: "Montant",
                    dataIndex: "montant",
                    key: "montant",
                    render: (montant) => `${montant.toLocaleString()} DA`,
                  },
                ]}
                pagination={false}
                size="small"
              />
            </Card>

            {selectedFacture.paiements.length > 0 && (
              <Card
                title="Historique des paiements"
                size="small"
                style={{ marginTop: 16 }}
              >
                <Table
                  dataSource={selectedFacture.paiements}
                  columns={[
                    { title: "Date", dataIndex: "datePaiement", key: "datePaiement" },
                    {
                      title: "Montant",
                      dataIndex: "montant",
                      key: "montant",
                      render: (montant) => `${montant.toLocaleString()} DA`,
                    },
                    { title: "Mode", dataIndex: "modePaiement", key: "modePaiement" },
                    { title: "Référence", dataIndex: "reference", key: "reference" },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}
          </>
        )}
      </Modal>

      {/* Modal Ajouter Paiement */}
      <Modal
        title={`Enregistrer un paiement - ${selectedFacture?.numeroFacture}`}
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
                {selectedFacture.montantTTC.toLocaleString()} DA
              </Descriptions.Item>
              <Descriptions.Item label="Déjà payé">
                {selectedFacture.montantPaye.toLocaleString()} DA
              </Descriptions.Item>
              <Descriptions.Item label="Restant à payer">
                <strong style={{ color: "#ff4d4f" }}>
                  {selectedFacture.montantRestant.toLocaleString()} DA
                </strong>
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={handlePaiementSubmit}>
              <Form.Item
                name="montant"
                label="Montant du paiement"
                rules={[
                  { required: true, message: "Veuillez saisir le montant" },
                  {
                    type: "number",
                    max: selectedFacture.montantRestant,
                    message: `Le montant ne peut pas dépasser ${selectedFacture.montantRestant} DA`,
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={selectedFacture.montantRestant}
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
    </div>
  );
};

export default Factures;