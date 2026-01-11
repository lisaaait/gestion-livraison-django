import { Menu, Layout, Avatar, Space } from "antd";
import { Dropdown } from "antd";
import {
  TruckOutlined,
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  WarningOutlined,
  CarOutlined,
  EnvironmentOutlined,
  CalculatorOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Link, useLocation,useNavigate } from "react-router-dom";

const { Sider } = Layout;

const Sidebar = () => {
  const location = useLocation();
const navigate = useNavigate();
 const showLogoutConfirm = () => {
    Modal.confirm({
      title: "Déconnexion",
      content: "Voulez-vous vraiment vous déconnecter ?",
      cancelText: "Annuler",
      okText: "Oui",
      okType: "danger",
      onOk() {
        navigate("/");
      },
      centered: true,
    });
  };
  const menuItems = [
    {
      key: "/admin",
      icon: <DashboardOutlined />,
      label: <Link to="/admin">Dashboard</Link>,
    },
    {
      key: "/admin/clients",
      icon: <UserOutlined />,
      label: <Link to="/admin/clients">Clients</Link>,
    
    },
    {
      key: "/admin/expeditions",
      icon: <TruckOutlined />,
      label: <Link to="/admin/expeditions">Expéditions</Link>,
    },
    {
      key: "/admin/factures",
      icon: <FileTextOutlined />,
      label: <Link to="/admin/factures">Factures</Link>,
      
    },
    {
      key: "/admin/paiements",
      icon: <CreditCardOutlined />,
      label: <Link to="/admin/paiements">Paiements</Link>,
      
    },
    {
      key: "/admin/reclamations",
      icon: <WarningOutlined />,
      label: <Link to="/admin/reclamations">Réclamations</Link>,
      
    },
    {
      key: "/admin/incidents",
      icon: <WarningOutlined />,
      label: <Link to="/admin/incidents">Incidents</Link>,
      
    },
    {
      key: "/admin/tournees",
      icon: <CarOutlined />,
      label: <Link to="/admin/tournees">Tournées</Link>,
      disabled: true,
    },
    {
      key: "/admin/destinations",
      icon: <EnvironmentOutlined />,
      label: <Link to="/admin/destinations">Destinations</Link>,
      disabled: true,
    },
    {
      key: "/admin/tarification",
      icon: <CalculatorOutlined />,
      label: <Link to="/admin/tarification">Tarification</Link>,
      disabled: true,
    },
  ];
const logOutBtn = [ 
    {
       key: "/",
      icon: <LogoutOutlined/>,
       label: (
      <span onClick={showLogoutConfirm}>
        Se déconnecter
      </span>
    ),
    },
  ];

  return (
    <Sider
      width={250}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "sticky",
        left: 0,
        top: 0,
        bottom: 0,
         display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 20,
          fontWeight: "bold",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        🚚 LogiSys
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ marginTop: 16, flex: 1 }}
        items={menuItems}
      />
           < Menu 
      theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ marginTop:"auto"}}
        items={logOutBtn}/>
    </Sider>
  );
};

export default Sidebar;