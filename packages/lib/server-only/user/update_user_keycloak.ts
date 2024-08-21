import axios from 'axios';
import qs from 'qs';

export const updateUserProfileInKeycloak = async (
  email: string,
  newEmail: string,
  newName: string | null
): Promise<any> => {
  try {
    // Fetch the admin token from Keycloak
    const adminTokenResponse = await axios.post(
      `${process.env.NEXT_PRIVATE_APISIX_URL}/realms/master/protocol/openid-connect/token`,
      qs.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.NEXT_PRIVATE_KEYCLOAK_CLIENT_ID,
        client_secret: process.env.NEXT_PRIVATE_KEYCLOAK_CLIENT_SECRET,
        scope: 'openid',
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const adminTokenData = adminTokenResponse.data;
    const accessToken = adminTokenData.access_token;

    // Get the user from Keycloak by email
    const usersResponse = await axios.get(
      `${process.env.NEXT_PRIVATE_APISIX_URL}/admin/realms/master/users`, 
      {
        params: { email },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const users = usersResponse.data;
    if (users.length === 0) {
      console.log(`User with email ${email} not found in Keycloak`);
      return `User with email ${email} not found in Keycloak`;
    }

    // Prepare update data
    const updateData: any = { email: newEmail };

    if (newName !== null) {
      const nameParts = newName.split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ');
    }

    // Update the user profile in Keycloak
    const userId = users[0].id;
    const updateResponse = await axios.put(
      `${process.env.NEXT_PRIVATE_APISIX_URL}/admin/realms/master/users/${userId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return `Successfully updated user with email ${email} to new email ${newEmail} and name ${newName || 'unchanged'} in Keycloak`;
  } catch (error) {
    console.error(`Failed to update user in Keycloak: ${(error as any).message}`);
    throw new Error(`Failed to update user in Keycloak`);
  }
};
