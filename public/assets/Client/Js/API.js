const API_TOKEN = "e0c711d8-e3a7-11ef-9022-7e9c01851c55";
const SHOP_ID = 5617503;

const provinceSelect = document.getElementById("province");
const districtSelect = document.getElementById("district");
const wardSelect = document.getElementById("ward");
const shippingFeeInput = document.getElementById("priceShipping");

// Tải danh sách tỉnh/thành phố
async function loadProvinces() {
   const response = await fetch("https://online-gateway.ghn.vn/shiip/public-api/master-data/province", {
      headers: { "Token": API_TOKEN }
   });
   const data = await response.json();
   if (data.code === 200) {
      data.data.forEach(province => {
         const option = document.createElement("option");
         option.value = province.ProvinceID;
         option.textContent = province.ProvinceName;
         provinceSelect.appendChild(option);
      });
   }
}

// Tải danh sách quận/huyện
async function loadDistricts(provinceID) {
   districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
   districtSelect.disabled = true;

   const response = await fetch("https://online-gateway.ghn.vn/shiip/public-api/master-data/district", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Token": API_TOKEN
      },
      body: JSON.stringify({ province_id: parseInt(provinceID) })
   });

   const data = await response.json();
   if (data.code === 200) {
      data.data.forEach(district => {
         const option = document.createElement("option");
         option.value = district.DistrictID;
         option.textContent = district.DistrictName;
         districtSelect.appendChild(option);
      });
      districtSelect.disabled = false;
   } else {
      console.error("Lỗi API quận/huyện:", data);
   }
}

// Tải danh sách phường/xã
async function loadWards(districtID) {
   wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
   wardSelect.disabled = true;

   const response = await fetch("https://online-gateway.ghn.vn/shiip/public-api/master-data/ward", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Token": API_TOKEN
      },
      body: JSON.stringify({ district_id: parseInt(districtID) })
   });

   const data = await response.json();
   if (data.code === 200) {
      data.data.forEach(ward => {
         const option = document.createElement("option");
         option.value = ward.WardCode;
         option.textContent = ward.WardName;
         wardSelect.appendChild(option);
      });
      wardSelect.disabled = false;
   } else {
      console.error("Lỗi API phường/xã:", data);
   }
}

// Tính phí vận chuyển
async function getValidServiceId(fromDistrict, toDistrict) {
   const response = await fetch("https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Token": API_TOKEN
      },
      body: JSON.stringify({ shop_id: SHOP_ID, from_district: fromDistrict, to_district: toDistrict })
   });

   const data = await response.json();
   if (data.code === 200 && data.data.length > 0) {
      return data.data[0].service_id;  // Lấy service_id đầu tiên hợp lệ
   } else {
      console.error("Không tìm thấy service_id hợp lệ", data);
      return null;
   }
}

async function calculateShippingFee() {
   const toDistrict = districtSelect.value;
   const weight = 2000;

   if (!toDistrict) {
      document.getElementById("priceShipping").textContent = "Vui lòng chọn Quận/Huyện";
      return;
   }

   const serviceId = await getValidServiceId(1542, parseInt(toDistrict));
   if (!serviceId) {
      document.getElementById("priceShipping").textContent = "Không có dịch vụ GHN cho tuyến này";
      return;
   }

   const requestData = {
      shop_id: SHOP_ID,
      from_district_id: 1542,
      to_district_id: parseInt(toDistrict),
      service_id: serviceId,
      weight: weight
   };

   console.log("Dữ liệu gửi API:", requestData);

   const response = await fetch("https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Token": API_TOKEN
      },
      body: JSON.stringify(requestData)
   });

   const data = await response.json();
   console.log("Kết quả API:", data);

   if (data.code === 200) {
      document.getElementById("priceShipping").textContent = new Intl.NumberFormat('vi-VN', {
         style: 'currency',
         currency: 'VND'
      }).format(data.data.total);
   } else {
      document.getElementById("priceShipping").textContent = "Tuyến đường chưa được hỗ trợ !!!";
      console.error("Lỗi tính phí vận chuyển:", data);
   }
}



// Gọi API khi trang tải
document.addEventListener("DOMContentLoaded", loadProvinces);

// Khi người dùng chọn tỉnh/thành phố
provinceSelect.addEventListener("change", function () {
   if (this.value) {
      loadDistricts(this.value);
   } else {
      districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
      districtSelect.disabled = true;
   }
});

// Khi người dùng chọn quận/huyện
districtSelect.addEventListener("change", function () {
   if (this.value) {
      loadWards(this.value);
   } else {
      wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
      wardSelect.disabled = true;
   }
});

wardSelect.addEventListener("change", function () {
   if (this.value) {
      calculateShippingFee(); // Gọi hàm tính phí 
   }
});
