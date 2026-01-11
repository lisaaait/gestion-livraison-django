// src/pages/Paiements/Paiements.jsx
import React, { useContext, useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  message,
  Input,
  Popconfirm,
  Card,
  Tag,
  Statistic,
  Row,
  Col,
  Empty,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DollarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { PaiementContext } from "../../context/PaiementContext";
import { FactureContext } from "../../context/FactureContext";

const Paiements = () => {
  const {
    paiements,
    loading,
    fetchPaiements,
    creerPaiement,
    modifierPaiement,
    supprimerPaiement,
    fetchStatistiques,
  } = useContext(PaiementContext);
  
  const { factures, fetchFactures } = useContext(FactureContext);

  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPaiement, setEditingPaiement] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPaiements();
    fetchFactures();
    loadStatistiques();
  }, [fetchPaiements, fetchFactures]);

  const loadStatistiques = async () => {
    try {
      const data = await fetchStatistiques();
      setStats(data);
    } catch (err) {
      console.error("Erreur chargement stats", err);
    }
  };

  const openCreateModal = () => {
    setEditingPaiement(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (paiement) => {
    setEditingPaiement(paiement);
    form.setFieldsValue({
      montant: paiement.montant,
      mode: paiement.mode,
      date: paiement.date ? dayjs(paiement.date) : dayjs(),
      remarques: paiement.remarques,
      code_facture: paiement.code_facture,
      reference: paiement.reference,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    const data = {
      code_facture: values.code_facture, // CORRECTION: envoyer code_facture (string)
      date: values.date.format("YYYY-MM-DD"),
      montant: values.montant,
      mode: values.mode,
      remarques: values.remarques || "",
      // La référence est optionnelle, le backend la génère automatiquement
      ...(values.reference && { reference: values.reference }),
    };

    try {
      if (editingPaiement) {
        await modifierPaiement(editingPaiement.id, data);
        message.success("Paiement modifié avec succès");
      } else {
        await creerPaiement(data);
        message.success("Paiement créé avec succès");
      }
      setModalVisible(false);
      form.resetFields();
      loadStatistiques();
    } catch (err) {
      console.error("Erreur détaillée:", err);
      
      // Extraire le message d'erreur du backend
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.error ||
                       err.response?.data?.montant_verse?.[0] ||
                       err.response?.data?.code_facture?.[0] ||
                       "Erreur lors de l'opération";
      
      message.error(errorMsg);
      
      // Log pour debug
      if (err.response?.data?.traceback) {
        console.error("Traceback serveur:", err.response.data.traceback);
      }
    }
  };

  const handleDelete = async (paiementId) => {
    try {
      await supprimerPaiement(paiementId);
      message.success("Paiement supprimé");
      loadStatistiques();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Erreur suppression paiement";
      message.error(errorMsg);
    }
  };

  // Trouver la facture correspondante
  const getFactureInfo = (codeFacture) => {
    const facture = factures.find((f) => f.code_facture === codeFacture);
    return facture || null;
  };

  const filteredPaiements = paiements.filter((p) =>
    p.reference?.toLowerCase().includes(searchText.toLowerCase()) ||
    p.code_facture?.toLowerCase().includes(searchText.toLowerCase()) ||
    p.remarques?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      width: 150,
      sorter: (a, b) => (a.reference || "").localeCompare(b.reference || ""),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Montant",
      dataIndex: "montant",
      key: "montant",
      width: 130,
      render: (montant) => (
        <strong style={{ color: "#52c41a" }}>
          {(montant || 0).toLocaleString()} DA
        </strong>
      ),
      sorter: (a, b) => (a.montant || 0) - (b.montant || 0),
    },
    {
      title: "Mode",
      dataIndex: "mode",
      key: "mode",
      width: 150,
      render: (mode, record) => (
        <Tag color="blue">{record.modeDisplay || mode}</Tag>
      ),
      filters: [
        { text: "Espèces", value: "ESPECES" },
        { text: "Chèque", value: "CHEQUE" },
        { text: "Virement bancaire", value: "VIREMENT" },
        { text: "Carte bancaire", value: "CARTE" },
        { text: "Paiement mobile", value: "MOBILE" },
      ],
      onFilter: (value, record) => record.mode === value,
    },
    {
      title: "Facture",
      dataIndex: "code_facture",
      key: "code_facture",
      width: 150,
      render: (codeFacture) => {
        const facture = getFactureInfo(codeFacture);
        return (
          <Space direction="vertical" size="small">
            <strong>{codeFacture || "N/A"}</strong>
            {facture && (
              <span style={{ fontSize: 12, color: "#666" }}>
                {facture.clientNom} {facture.clientPrenom}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: "Remarques",
      dataIndex: "remarques",
      key: "remarques",
      ellipsis: true,
    },
    {
      title: "Date Création",
      dataIndex: "date_creation",
      key: "date_creation",
      width: 120,
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            type="link"
            size="small"
          >
            Modifier
          </Button>
          <Popconfirm
            title="Supprimer ce paiement ?"
            description="Cette action mettra à jour le solde de la facture."
            onConfirm={() => handleDelete(record.id)}
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
      {/* Statistiques */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Paiements"
                value={stats.total_paiements || 0}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Montant Total"
                value={stats.montant_total || 0}
                suffix="DA"
                precision={0}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Paiements ce mois"
                value={
                  paiements.filter(
                    (p) =>
                      p.date &&
                      dayjs(p.date).month() === dayjs().month() &&
                      dayjs(p.date).year() === dayjs().year()
                  ).length
                }
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card title="Gestion des Paiements" bordered={false}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Input
              placeholder="Rechercher par référence, facture ou remarques"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 400 }}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Ajouter Paiement
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredPaiements}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} paiements`,
            }}
            scroll={{ x: 1400 }}
            bordered
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchText
                      ? `Aucun paiement trouvé pour "${searchText}"`
                      : "Aucun paiement disponible"
                  }
                />
              ),
            }}
            summary={(pageData) => {
              let totalMontant = 0;
              pageData.forEach(({ montant }) => {
                totalMontant += montant || 0;
              });

              return (
                <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <strong>Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <strong style={{ color: "#52c41a" }}>
                      {totalMontant.toLocaleString()} DA
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={5} />
                </Table.Summary.Row>
              );
            }}
          />
        </Space>
      </Card>

      {/* Modal Création/Modification Paiement */}
      <Modal
        title={editingPaiement ? "Modifier Paiement" : "Créer Paiement"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingPaiement ? "Modifier" : "Créer"}
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* La référence est auto-générée par la DB, on ne l'affiche pas en création */}
          {editingPaiement && (
            <Form.Item label="Référence">
              <Input disabled value={editingPaiement.reference} />
            </Form.Item>
          )}

          <Form.Item
            name="code_facture"
            label="Facture"
            rules={[{ required: true, message: "Veuillez sélectionner la facture" }]}
          >
            <Select
              showSearch
              placeholder="Sélectionner une facture"
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option.label).toLowerCase().includes(String(input).toLowerCase())
              }
              allowClear
              options={factures
                .filter((f) => !f.est_payee || f.montantRestant > 0)
                .map((f) => ({
                  key: f.code_facture,
                  value: f.code_facture, // ← CORRECTION: Utiliser code_facture, pas id
                  label: `${f.code_facture} - ${f.clientNom} ${f.clientPrenom} (Reste: ${f.montantRestant?.toLocaleString()} DA)`,
                }))}
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Veuillez sélectionner la date" }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="montant"
            label="Montant"
            rules={[
              { required: true, message: "Veuillez saisir le montant" },
              { type: "number", min: 0.01, message: "Le montant doit être positif" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `${value} DA`}
              parser={(value) => value.replace(" DA", "")}
            />
          </Form.Item>

          <Form.Item
            name="mode"
            label="Mode de paiement"
            rules={[{ required: true, message: "Veuillez sélectionner le mode" }]}
          >
            <Select placeholder="Sélectionner un mode">
              <Select.Option value="ESPECES">Espèces</Select.Option>
              <Select.Option value="CHEQUE">Chèque</Select.Option>
              <Select.Option value="VIREMENT">Virement bancaire</Select.Option>
              <Select.Option value="CARTE">Carte bancaire</Select.Option>
              <Select.Option value="MOBILE">Paiement mobile</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="remarques" label="Remarques">
            <Input.TextArea rows={3} placeholder="Remarques optionnelles..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Paiements;