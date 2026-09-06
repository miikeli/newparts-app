import { Link } from "react-router-dom";

const AdminDashboardPage = () => {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Dashboard</p>
          <h1>Admin početna</h1>
        </div>
        <Link className="admin-primary-link" to="/admin/products/new">
          New product
        </Link>
      </div>

      <div className="admin-dashboard-grid">
        <article>
          <span>Faza 1</span>
          <strong>Products management</strong>
          <p>Upravljanje katalogom, cijenama, zalihama, slikama i fitment podacima.</p>
        </article>
        <article>
          <span>Sljedeće</span>
          <strong>Orders i customers</strong>
          <p>Admin workflow za porudžbine i kupce ostaje za narednu fazu.</p>
        </article>
      </div>
    </section>
  );
};

export default AdminDashboardPage;
