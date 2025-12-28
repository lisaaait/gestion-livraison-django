import { Table, Button, Space, Tag, Input, Card,Empty } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { ExpeditionContext } from "../../context/ExpeditionContext";

const Expeditions = () => {
  const { expeditions, fetchExpeditions, updateStatut } =
    useContext(ExpeditionContext);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchExpeditions();
  }, [fetchExpeditions]);

  // Filtrer les expéditions
  const filteredExpeditions = expeditions.filter(
    (exp) =>
      exp.code.toLowerCase().includes(searchText.toLowerCase()) ||
      exp.destination.toLowerCase().includes(searchText.toLowerCase()) ||
      exp.client.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 150,
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 150,
    },
    {
      title: "Destination",
      dataIndex: "destination",
      key: "destination",
      width: 200,
    },
    {
      title: "Date de création",
      dataIndex: "dateCreation",
      key: "dateCreation",
      width: 150,
      sorter: (a, b) => new Date(a.dateCreation) - new Date(b.dateCreation),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 120,
      render: (statut) => (
        <Tag color={statut === "livrée" ? "green" : "orange"}>
          {statut.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: "En cours", value: "en cours" },
        { text: "Livrée", value: "livrée" },
      ],
      onFilter: (value, record) => record.statut === value,
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => updateStatut(record.id, "livrée")}
            disabled={record.statut === "livrée"}
            size="small"
          >
            {record.statut === "livrée" ? "✓ Livrée" : "Valider"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Card
        title="Gestion des Expéditions"
        bordered={false}
        style={{ width: "100%" }}
      >
        <Input
          placeholder="Rechercher par code, destination ou client"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16, width: 400 }}
          allowClear
        />
        <Table
          columns={columns}
          dataSource={filteredExpeditions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} expéditions`,
          }}
          scroll={{ x: "max-content" }}
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
      </Card>
    </div>
  );
};

export default Expeditions;