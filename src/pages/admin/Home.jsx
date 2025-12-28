import { Card, Row, Col, Typography } from "antd";
import {
  UserOutlined,
  TruckOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  WarningOutlined,
  CarOutlined,
  EnvironmentOutlined,
  CalculatorOutlined,
 InboxOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Clients",
      description: "Gérer les clients et leurs informations",
      icon: <UserOutlined style={{ fontSize: 40, color: "#3b82f6" }} />,
      color: "#3b82f6",
      path: "/admin/clients",
      available: true,
    },
    {
      title: "Expéditions",
      description: "Créer et suivre les expéditions",
      icon: <TruckOutlined style={{ fontSize: 40, color: "#06b6d4" }} />,
      color: "#06b6d4",
      path: "/admin/expeditions",
      available: true,
    },
    {
      title: "Factures",
      description: "Consulter et gérer les factures",
      icon: <FileTextOutlined style={{ fontSize: 40, color: "#8b5cf6" }} />,
      color: "#8b5cf6",
      path: "/admin/factures",
      available: true,
    },
    {
      title: "Paiements",
      description: "Enregistrer les paiements",
      icon: <CreditCardOutlined style={{ fontSize: 40, color: "#10b981" }} />,
      color: "#10b981",
      path: "/admin/paiements",
      available: true,
    },
    {
      title: "Réclamations",
      description: "Gérer les réclamations clients",
      icon: <WarningOutlined style={{ fontSize: 40, color: "#f59e0b" }} />,
      color: "#f59e0b",
      path: "/admin/reclamations",
      available: false,
    },
    {
      title: "Tournées",
      description: "Planifier les tournées de livraison",
      icon: <CarOutlined style={{ fontSize: 40, color: "#ec4899" }} />,
      color: "#ec4899",
      path: "/admin/tournees",
      available: false,
    },
    {
      title: "Destinations",
      description: "Gérer les destinations",
      icon: <EnvironmentOutlined style={{ fontSize: 40, color: "#ef4444" }} />,
      color: "#ef4444",
      path: "/admin/destinations",
      available: false,
    },
    {
      title: "Tarification",
      description: "Configurer les tarifs",
      icon: <CalculatorOutlined style={{ fontSize: 40, color: "#14b8a6" }} />,
      color: "#14b8a6",
      path: "/admin/tarification",
      available: false,
    },
  ];

  const handleCardClick = (card) => {
    if (card.available) {
      navigate(card.path);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header Section */}
      <div style={{ marginBottom: 40 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Système de Gestion Logistique
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Gérez efficacement vos opérations logistiques
        </Text>
      </div>

      {/* Cards Grid */}
      <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
        {cards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable={card.available}
              style={{
                height: "100%",
                cursor: card.available ? "pointer" : "not-allowed",
                opacity: card.available ? 1 : 0.6,
                borderRadius: 12,
                border: `2px solid ${card.available ? card.color : "#d1d5db"}`,
              }}
              onClick={() => handleCardClick(card)}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: 16 }}>{card.icon}</div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {card.title}
                </Title>
                <Text type="secondary">{card.description}</Text>
                {!card.available && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="warning" style={{ fontSize: 12 }}>
                      (Bientôt disponible)
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Welcome Section */}
      <Card
        style={{
          background: "#e0f2fe",
          borderRadius: 12,
          border: "1px solid #0284c7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <InboxOutlined style={{ fontSize: 48, color: "#0284c7" }} />
          <div>
            <Title level={4} style={{ marginBottom: 8, color: "#0c4a6e" }}>
              Bienvenue dans votre système de gestion
            </Title>
            <Text style={{ color: "#0c4a6e" }}>
              Ce système vous permet de gérer l'ensemble de vos opérations
              logistiques : clients, expéditions, facturation, tournées et bien
              plus encore.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Home;